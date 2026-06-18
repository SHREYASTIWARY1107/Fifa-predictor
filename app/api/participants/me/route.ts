import { NextResponse } from "next/server";
import { getParticipantSessionId, isPinVerified } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const verified = await isPinVerified();
    if (!verified) {
      return NextResponse.json({ error: "PIN not verified" }, { status: 401 });
    }

    const sessionId = await getParticipantSessionId();
    if (!sessionId) {
      return NextResponse.json({ participant: null });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("participants")
      .select("id, display_name, avatar_color, created_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ participant: null });
    }

    return NextResponse.json({ participant: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

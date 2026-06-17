import { NextResponse } from "next/server";
import { isPinVerified } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verified = await isPinVerified();
    if (!verified) {
      return NextResponse.json({ error: "PIN not verified" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("participants")
      .select("id, display_name, avatar_color, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    return NextResponse.json({ participant: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

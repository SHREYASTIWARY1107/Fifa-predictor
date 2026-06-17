import { NextResponse } from "next/server";
import { isPinVerified } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const verified = await isPinVerified();
    if (!verified) {
      return NextResponse.json({ error: "PIN not verified" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("rank", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leaderboard: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

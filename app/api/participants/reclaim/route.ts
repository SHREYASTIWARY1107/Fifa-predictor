import { NextResponse } from "next/server";
import {
  hashReclaimPassword,
  isPinVerified,
  setParticipantSession,
  verifyReclaimPassword,
} from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const verified = await isPinVerified();
    if (!verified) {
      return NextResponse.json({ error: "PIN not verified" }, { status: 401 });
    }

    const { display_name, password } = (await request.json()) as {
      display_name?: string;
      password?: string;
    };

    const name = display_name?.trim();
    if (!name || !password) {
      return NextResponse.json(
        { error: "Display name and password are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: participant, error } = await supabase
      .from("participants")
      .select("id, display_name, avatar_color, created_at, password_hash")
      .eq("display_name", name)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!participant) {
      return NextResponse.json({ error: "No player found with that name" }, { status: 404 });
    }

    const valid = await verifyReclaimPassword(password, participant.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    if (!participant.password_hash) {
      const passwordHash = await hashReclaimPassword(password);
      await supabase
        .from("participants")
        .update({ password_hash: passwordHash })
        .eq("id", participant.id);
    }

    await setParticipantSession(participant.id);

    const { password_hash: _, ...safe } = participant;
    return NextResponse.json({ participant: safe });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

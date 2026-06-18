import { NextResponse } from "next/server";
import { isPinVerified, setParticipantSession } from "@/lib/auth";
import { AVATAR_COLORS } from "@/lib/constants";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const verified = await isPinVerified();
    if (!verified) {
      return NextResponse.json({ error: "PIN not verified" }, { status: 401 });
    }

    const { display_name } = (await request.json()) as { display_name?: string };
    const name = display_name?.trim();

    if (!name || name.length < 2 || name.length > 20) {
      return NextResponse.json(
        { error: "Name must be 2-20 characters" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const avatarColor =
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const { data, error } = await supabase
      .from("participants")
      .insert({
        display_name: name,
        avatar_color: avatarColor,
      })
      .select("id, display_name, avatar_color, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "That name is already taken" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await setParticipantSession(data.id);

    return NextResponse.json({ participant: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

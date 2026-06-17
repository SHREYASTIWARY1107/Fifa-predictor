import { NextResponse } from "next/server";
import { isPinVerified } from "@/lib/auth";
import { isMatchLocked } from "@/lib/match-sync";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const verified = await isPinVerified();
    if (!verified) {
      return NextResponse.json({ error: "PIN not verified" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("participant_id");
    const matchId = searchParams.get("match_id");
    const reveal = searchParams.get("reveal") === "true";

    const supabase = createServiceClient();
    let query = supabase.from("predictions").select(
      reveal
        ? "*, participants(display_name, avatar_color), matches(team1, team2, status, kickoff_at, home_score, away_score)"
        : "*"
    );

    if (participantId) query = query.eq("participant_id", participantId);
    if (matchId) query = query.eq("match_id", matchId);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ predictions: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const verified = await isPinVerified();
    if (!verified) {
      return NextResponse.json({ error: "PIN not verified" }, { status: 401 });
    }

    const body = (await request.json()) as {
      participant_id?: string;
      match_id?: string;
      home_pred?: number;
      away_pred?: number;
    };

    const { participant_id, match_id, home_pred, away_pred } = body;

    if (!participant_id || !match_id) {
      return NextResponse.json(
        { error: "participant_id and match_id are required" },
        { status: 400 }
      );
    }

    if (
      home_pred === undefined ||
      away_pred === undefined ||
      home_pred < 0 ||
      away_pred < 0 ||
      home_pred > 20 ||
      away_pred > 20
    ) {
      return NextResponse.json(
        { error: "Scores must be between 0 and 20" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: participant } = await supabase
      .from("participants")
      .select("id")
      .eq("id", participant_id)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: "Invalid participant" }, { status: 400 });
    }

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, kickoff_at, status")
      .eq("id", match_id)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (isMatchLocked(match)) {
      return NextResponse.json(
        { error: "Predictions are locked for this match" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("predictions")
      .upsert(
        {
          participant_id,
          match_id,
          home_pred,
          away_pred,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "participant_id,match_id" }
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ prediction: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

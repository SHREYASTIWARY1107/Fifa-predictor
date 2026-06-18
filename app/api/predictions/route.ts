import { NextResponse } from "next/server";
import {
  getParticipantSessionId,
  isPinVerified,
} from "@/lib/auth";
import { isMatchLocked } from "@/lib/match-sync";
import { createServiceClient } from "@/lib/supabase/server";
import type { Match } from "@/lib/types";

type PredictionRow = {
  id: string;
  participant_id: string;
  match_id: string;
  home_pred: number;
  away_pred: number;
  points: number;
  created_at: string;
  updated_at: string;
  participants?: { display_name: string; avatar_color: string } | null;
  matches?: Match | null;
};

function isKickoffPassed(kickoffAt: string) {
  return new Date(kickoffAt).getTime() <= Date.now();
}

function filterByRevealRules(
  rows: PredictionRow[],
  viewerId: string | null,
  reveal: boolean
) {
  if (!reveal) return rows;

  return rows.filter((row) => {
    const match = row.matches;
    if (!match) return false;
    if (viewerId && row.participant_id === viewerId) return true;
    return isKickoffPassed(match.kickoff_at);
  });
}

async function enrichPredictions(
  supabase: ReturnType<typeof createServiceClient>,
  rows: Array<Record<string, unknown>>,
  withReveal: boolean
) {
  const matchIds = [...new Set(rows.map((r) => r.match_id as string))];
  if (matchIds.length === 0) return [] as PredictionRow[];

  const { data: matches, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .in("id", matchIds);

  if (matchError) throw new Error(matchError.message);

  const matchMap = new Map((matches ?? []).map((m) => [m.id, m as Match]));

  let enriched: PredictionRow[] = rows.map((row) => ({
    ...(row as Omit<PredictionRow, "matches">),
    matches: matchMap.get(row.match_id as string) ?? null,
  }));

  if (withReveal) {
    const participantIds = [...new Set(rows.map((r) => r.participant_id as string))];
    if (participantIds.length > 0) {
      const { data: participants } = await supabase
        .from("participants")
        .select("id, display_name, avatar_color")
        .in("id", participantIds);

      const participantMap = new Map(
        (participants ?? []).map((p) => [p.id, { display_name: p.display_name, avatar_color: p.avatar_color }])
      );

      enriched = enriched.map((row) => ({
        ...row,
        participants: participantMap.get(row.participant_id) ?? row.participants ?? null,
      }));
    }
  }

  return enriched;
}

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
    const matchStatus = searchParams.get("match_status");

    const viewerId = (await getParticipantSessionId()) ?? participantId;

    const supabase = createServiceClient();

    if (reveal && matchStatus) {
      const { data: statusMatches, error: matchError } = await supabase
        .from("matches")
        .select("id")
        .eq("status", matchStatus);

      if (matchError) {
        return NextResponse.json({ error: matchError.message }, { status: 500 });
      }

      const matchIds = (statusMatches ?? []).map((m) => m.id);
      if (matchIds.length === 0) {
        return NextResponse.json({ predictions: [] });
      }

      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .in("match_id", matchIds);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const enriched = await enrichPredictions(
        supabase,
        (data ?? []) as Record<string, unknown>[],
        true
      );
      const filtered = filterByRevealRules(enriched, viewerId, true);

      return NextResponse.json({ predictions: filtered });
    }

    let query = supabase.from("predictions").select("*");

    if (participantId) query = query.eq("participant_id", participantId);
    if (matchId) query = query.eq("match_id", matchId);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const enriched = reveal
      ? await enrichPredictions(supabase, (data ?? []) as Record<string, unknown>[], true)
      : ((data ?? []) as PredictionRow[]);

    const filtered = filterByRevealRules(enriched, viewerId, reveal);

    return NextResponse.json({ predictions: filtered });
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

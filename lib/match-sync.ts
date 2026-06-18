import { createServiceClient } from "@/lib/supabase/server";
import { WCUP_API_URL } from "@/lib/constants";
import type { MatchStage, WcupMatch } from "@/lib/types";

export function mapRoundToStage(round: string): MatchStage {
  const normalized = round.toLowerCase();
  if (normalized.includes("round of 32")) return "r32";
  if (normalized.includes("round of 16")) return "r16";
  if (normalized.includes("quarter")) return "qf";
  if (normalized.includes("semi")) return "sf";
  if (normalized.includes("3rd") || normalized.includes("third")) return "third";
  if (normalized.includes("final")) return "final";
  return "group";
}

export function mapWcupStatus(status: string): "upcoming" | "live" | "finished" {
  if (status === "finished") return "finished";
  if (status === "live") return "live";
  return "upcoming";
}

export function mapWcupMatch(match: WcupMatch) {
  const stage = mapRoundToStage(match.round);
  const status = mapWcupStatus(match.status);
  const [homeScore, awayScore] = match.score ?? [null, null];

  return {
    external_id: match.id,
    round: match.round,
    stage,
    group_name: match.group || null,
    team1: match.team1,
    team2: match.team2,
    flag1: match.flag1 || null,
    flag2: match.flag2 || null,
    venue: match.ground || null,
    kickoff_at: new Date(match.datetime * 1000).toISOString(),
    status,
    home_score: homeScore,
    away_score: awayScore,
    live_minute: match.live_minute ?? null,
    synced_at: new Date().toISOString(),
  };
}

export async function fetchWcupMatches(): Promise<WcupMatch[]> {
  const response = await fetch(WCUP_API_URL, {
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch WC matches: ${response.status}`);
  }

  const data = (await response.json()) as { ok: boolean; matches: WcupMatch[] };

  if (!data.ok || !Array.isArray(data.matches)) {
    throw new Error("Invalid WC API response");
  }

  return data.matches;
}

export async function syncMatchesFromApi() {
  const supabase = createServiceClient();
  const matches = await fetchWcupMatches();
  const mapped = matches.map(mapWcupMatch);

  const { error } = await supabase.from("matches").upsert(mapped, {
    onConflict: "external_id",
  });

  if (error) {
    throw new Error(`Failed to upsert matches: ${error.message}`);
  }

  const { data: finishedMatches, error: finishedError } = await supabase
    .from("matches")
    .select("id")
    .eq("status", "finished");

  if (finishedError) {
    throw new Error(`Failed to load finished matches: ${finishedError.message}`);
  }

  for (const match of finishedMatches ?? []) {
    const { error: pointsError } = await supabase.rpc("recalculate_match_points", {
      p_match_id: match.id,
    });

    if (pointsError) {
      throw new Error(`Failed to recalculate points: ${pointsError.message}`);
    }
  }

  await supabase
    .from("league_settings")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", 1);

  return {
    synced: mapped.length,
    finished: finishedMatches?.length ?? 0,
  };
}

export function isMatchLocked(match: {
  kickoff_at: string;
  status: string;
}): boolean {
  if (match.status !== "upcoming") return true;
  return new Date(match.kickoff_at).getTime() <= Date.now();
}

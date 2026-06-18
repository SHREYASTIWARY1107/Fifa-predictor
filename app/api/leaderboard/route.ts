import { NextResponse } from "next/server";
import { isPinVerified } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const verified = await isPinVerified();
    if (!verified) {
      return NextResponse.json({ error: "PIN not verified" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    const supabase = createServiceClient();

    if (scope === "today") {
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date();
      end.setUTCHours(23, 59, 59, 999);

      const { data: todayMatches, error: matchError } = await supabase
        .from("matches")
        .select("id")
        .eq("status", "finished")
        .gte("kickoff_at", start.toISOString())
        .lte("kickoff_at", end.toISOString());

      if (matchError) {
        return NextResponse.json({ error: matchError.message }, { status: 500 });
      }

      const matchIds = (todayMatches ?? []).map((m) => m.id);
      if (matchIds.length === 0) {
        return NextResponse.json({ leaderboard: [] });
      }

      const { data: preds, error: predError } = await supabase
        .from("predictions")
        .select("participant_id, points, participants(display_name, avatar_color)")
        .in("match_id", matchIds);

      if (predError) {
        return NextResponse.json({ error: predError.message }, { status: 500 });
      }

      const totals = new Map<
        string,
        {
          participant_id: string;
          display_name: string;
          avatar_color: string;
          total_points: number;
          predictions_made: number;
        }
      >();

      for (const row of preds ?? []) {
        const p = row.participants as
          | { display_name: string; avatar_color: string }
          | { display_name: string; avatar_color: string }[]
          | null;
        const participant = Array.isArray(p) ? p[0] : p;
        if (!participant) continue;

        const existing = totals.get(row.participant_id) ?? {
          participant_id: row.participant_id,
          display_name: participant.display_name,
          avatar_color: participant.avatar_color,
          total_points: 0,
          predictions_made: 0,
        };

        existing.total_points += row.points ?? 0;
        existing.predictions_made += 1;
        totals.set(row.participant_id, existing);
      }

      const leaderboard = [...totals.values()]
        .sort((a, b) => b.total_points - a.total_points || a.display_name.localeCompare(b.display_name))
        .map((entry, index) => ({
          ...entry,
          exact_scores: 0,
          rank: index + 1,
        }));

      return NextResponse.json({ leaderboard });
    }

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

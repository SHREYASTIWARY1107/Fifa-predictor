"use client";

import type { Match } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { MatchSummaryHeader } from "@/components/MatchSummaryHeader";

export interface PredictionRow {
  id: string;
  participant_id: string;
  match_id: string;
  home_pred: number;
  away_pred: number;
  points: number;
  created_at: string;
  updated_at: string;
  participants: {
    display_name: string;
    avatar_color: string;
  };
  matches?: Pick<
    Match,
    | "team1"
    | "team2"
    | "status"
    | "kickoff_at"
    | "home_score"
    | "away_score"
    | "flag1"
    | "flag2"
    | "round"
    | "group_name"
    | "live_minute"
  >;
}

function sortByKickoffDesc(matches: Match[]) {
  return [...matches].sort(
    (a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime()
  );
}

export function MatchResults({
  matches,
  predictions,
  participantId,
  mode = "finished",
}: {
  matches: Match[];
  predictions: PredictionRow[];
  participantId?: string;
  mode?: "finished" | "live";
}) {
  const filtered = sortByKickoffDesc(
    matches.filter((m) => m.status === (mode === "live" ? "live" : "finished"))
  );

  if (filtered.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          {mode === "live"
            ? "No live matches right now."
            : "No finished matches yet. Results will show here after games end."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {mode === "finished" ? (
        <p className="text-center text-xs text-muted-foreground">
          3 pts exact · 1 pt correct result · 0 pts wrong
        </p>
      ) : null}

      {filtered.map((match) => {
        const matchPredictions = predictions.filter((p) => p.match_id === match.id);
        const mine = matchPredictions.find((p) => p.participant_id === participantId);

        return (
          <div key={match.id} className="space-y-3">
            <MatchSummaryHeader match={match} />

            {participantId ? (
              <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">
                  Your pick
                </span>
                {mine ? (
                  <div className="mt-1 flex items-center justify-between tabular-nums">
                    <span className="font-semibold">
                      {mine.home_pred} - {mine.away_pred}
                    </span>
                    {match.status === "finished" ? (
                      <span className="font-bold text-emerald-400">{mine.points} pts</span>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-1 text-muted-foreground">You didn&apos;t predict this match</p>
                )}
              </div>
            ) : null}

            <Card className="border-border/60 bg-card/60">
              <CardContent className="space-y-2 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Everyone&apos;s predictions
                </p>
                {matchPredictions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No predictions yet</p>
                ) : (
                  matchPredictions.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: p.participants?.avatar_color ?? "#666" }}
                        >
                          {(p.participants?.display_name ?? "?").slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-medium">
                          {p.participants?.display_name ?? "Unknown"}
                          {p.participant_id === participantId ? (
                            <span className="ml-2 text-[10px] text-emerald-400">YOU</span>
                          ) : null}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 tabular-nums">
                        <span>
                          {p.home_pred} - {p.away_pred}
                        </span>
                        {match.status === "finished" ? (
                          <span className="font-bold text-emerald-400">{p.points} pts</span>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

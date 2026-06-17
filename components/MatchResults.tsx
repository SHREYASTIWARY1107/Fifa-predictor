"use client";

import type { Match } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { MatchCard } from "@/components/MatchCard";

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
  matches: Match;
}

export function MatchResults({
  matches,
  predictions,
  participantId,
}: {
  matches: Match[];
  predictions: PredictionRow[];
  participantId?: string;
}) {
  const finished = matches.filter((m) => m.status === "finished");

  if (finished.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          No finished matches yet. Results will show here after games end.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {finished.map((match) => {
        const matchPredictions = predictions.filter((p) => p.match_id === match.id);
        const mine = matchPredictions.find((p) => p.participant_id === participantId);

        return (
          <div key={match.id} className="space-y-3">
            {participantId && mine ? (
              <MatchCard
                match={match}
                participantId={participantId}
                prediction={mine}
                showPoints
              />
            ) : null}

            <Card className="border-border/60 bg-card/60">
              <CardContent className="space-y-2 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Everyone&apos;s predictions
                </p>
                {matchPredictions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No predictions</p>
                ) : (
                  matchPredictions.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: p.participants.avatar_color }}
                        >
                          {p.participants.display_name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-medium">{p.participants.display_name}</span>
                      </div>
                      <div className="flex items-center gap-3 tabular-nums">
                        <span>
                          {p.home_pred} - {p.away_pred}
                        </span>
                        <span className="font-bold text-emerald-400">{p.points} pts</span>
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

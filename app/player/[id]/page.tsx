"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader, AppShell } from "@/components/AppShell";
import { MatchSummaryHeader } from "@/components/MatchSummaryHeader";
import { useParticipant } from "@/components/ParticipantContext";
import type { LeaderboardEntry, Match, Prediction } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

type PredictionWithMatch = Prediction & {
  matches?: Match | Match[] | null;
};

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { participant: me } = useParticipant();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [player, setPlayer] = useState<LeaderboardEntry | null>(null);
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setPlayerId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    try {
      const [playerRes, predsRes, boardRes] = await Promise.all([
        fetch(`/api/participants/${playerId}`),
        fetch(`/api/predictions?participant_id=${playerId}&reveal=true`),
        fetch("/api/leaderboard"),
      ]);

      const playerData = await playerRes.json();
      const predsData = await predsRes.json();
      const boardData = await boardRes.json();

      if (playerRes.ok && playerData.participant) {
        const boardEntry = (boardData.leaderboard ?? []).find(
          (e: LeaderboardEntry) => e.participant_id === playerId
        );
        setPlayer(
          boardEntry ?? {
            participant_id: playerData.participant.id,
            display_name: playerData.participant.display_name,
            avatar_color: playerData.participant.avatar_color,
            total_points: 0,
            exact_scores: 0,
            predictions_made: 0,
            rank: 0,
          }
        );
      }

      setPredictions(predsData.predictions ?? []);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => {
    return [...predictions].sort((a, b) => {
      const ma = Array.isArray(a.matches) ? a.matches[0] : a.matches;
      const mb = Array.isArray(b.matches) ? b.matches[0] : b.matches;
      const ta = ma?.kickoff_at ? new Date(ma.kickoff_at).getTime() : 0;
      const tb = mb?.kickoff_at ? new Date(mb.kickoff_at).getTime() : 0;
      return tb - ta;
    });
  }, [predictions]);

  const isMe = me?.id === playerId;

  return (
    <AppShell>
      <AppHeader
        title={player?.display_name ?? "Player"}
        subtitle={isMe ? "Your prediction history" : "Prediction history"}
      />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {isMe ? (
          <Link
            href="/"
            className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            Back to leaderboard
          </Link>
        ) : null}

        {loading ? (
          <p className="text-center text-muted-foreground">Loading history...</p>
        ) : !player ? (
          <p className="text-center text-muted-foreground">Player not found.</p>
        ) : (
          <>
            <Card className="border-border/60 bg-card/80">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total points</p>
                  <p className="text-3xl font-bold text-emerald-400">{player.total_points}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{player.predictions_made} picks</p>
                  <p>{player.exact_scores} exact</p>
                </div>
              </CardContent>
            </Card>

            {sorted.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No predictions yet.
                </CardContent>
              </Card>
            ) : (
              sorted.map((p) => {
                const match = Array.isArray(p.matches) ? p.matches[0] : p.matches;
                if (!match) return null;

                return (
                  <div key={p.id} className="space-y-2">
                    <MatchSummaryHeader match={match as Match} />
                    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between tabular-nums">
                        <span className="font-semibold">
                          Pick: {p.home_pred} - {p.away_pred}
                        </span>
                        {match.status === "finished" ? (
                          <span className="font-bold text-emerald-400">{p.points} pts</span>
                        ) : (
                          <span className="text-muted-foreground">{match.status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}

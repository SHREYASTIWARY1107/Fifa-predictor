"use client";

import Link from "next/link";
import type { LeaderboardEntry } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Medal } from "lucide-react";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="h-5 w-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-300" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="w-5 text-center text-sm text-muted-foreground">{rank}</span>;
}

export function Leaderboard({
  entries,
  highlightId,
}: {
  entries: LeaderboardEntry[];
  highlightId?: string;
}) {
  if (entries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          No players yet. Be the first to join and predict!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isYou = entry.participant_id === highlightId;
        return (
          <Link key={entry.participant_id} href={`/player/${entry.participant_id}`}>
            <Card
              className={
                isYou
                  ? "border-emerald-500/50 bg-emerald-500/5 transition-colors hover:bg-emerald-500/10"
                  : "border-border/60 bg-card/80 transition-colors hover:bg-card"
              }
            >
              <CardContent className="flex items-center gap-3 p-4">
                <RankBadge rank={entry.rank} />
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: entry.avatar_color }}
                >
                  {entry.display_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{entry.display_name}</p>
                    {isYou ? (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        YOU
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.exact_scores} exact · {entry.predictions_made} picks
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums text-emerald-400">
                    {entry.total_points}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    pts
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

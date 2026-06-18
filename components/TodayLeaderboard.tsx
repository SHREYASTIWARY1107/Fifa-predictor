"use client";

import { useState } from "react";
import type { LeaderboardEntry } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function TodayLeaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) {
    return (
      <Card className="border-border/60 bg-card/60">
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          No points scored today yet.
        </CardContent>
      </Card>
    );
  }

  const visible = expanded ? entries : entries.slice(0, 3);

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Today&apos;s points
          </p>
          {entries.length > 3 ? (
            <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Show less" : "See all"}
            </Button>
          ) : null}
        </div>
        <div className="space-y-2">
          {visible.map((entry) => (
            <div
              key={entry.participant_id}
              className="flex items-center justify-between rounded-lg bg-background/40 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">#{entry.rank}</span>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: entry.avatar_color }}
                >
                  {entry.display_name.slice(0, 2).toUpperCase()}
                </span>
                <span className="font-medium">{entry.display_name}</span>
              </div>
              <span className="font-bold tabular-nums text-emerald-400">
                {entry.total_points} pts
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Match } from "@/lib/types";
import { Radio } from "lucide-react";

function TeamFlag({ flag, team }: { flag: string | null; team: string }) {
  if (flag) {
    return (
      <img
        src={flag}
        alt={team}
        className="h-8 w-8 rounded-full border border-border/50 object-cover"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
      {team.slice(0, 3).toUpperCase()}
    </div>
  );
}

export function MatchSummaryHeader({ match }: { match: Match }) {
  const showScore = match.status === "finished" || match.status === "live";

  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {match.round}
            {match.group_name ? ` · ${match.group_name}` : ""}
          </div>
          {match.status === "live" ? (
            <Badge className="animate-pulse bg-red-500/20 text-red-300">
              <Radio className="mr-1 h-3 w-3" />
              LIVE{match.live_minute != null ? ` ${match.live_minute}'` : ""}
            </Badge>
          ) : match.status === "finished" ? (
            <Badge variant="secondary">FT</Badge>
          ) : null}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-2 text-center">
            <TeamFlag flag={match.flag1} team={match.team1} />
            <span className="text-sm font-semibold leading-tight">{match.team1}</span>
          </div>

          <div className="text-2xl font-bold tabular-nums">
            {showScore
              ? `${match.home_score ?? "-"} : ${match.away_score ?? "-"}`
              : "vs"}
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <TeamFlag flag={match.flag2} team={match.team2} />
            <span className="text-sm font-semibold leading-tight">{match.team2}</span>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          {new Date(match.kickoff_at).toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
      </CardContent>
    </Card>
  );
}

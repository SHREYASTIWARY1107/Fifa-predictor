"use client";

import type { Match } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const KNOCKOUT_STAGES = ["r32", "r16", "qf", "sf", "third", "final"] as const;

function BracketMatch({ match }: { match: Match }) {
  const score =
    match.status === "finished" || match.status === "live"
      ? `${match.home_score ?? "-"} - ${match.away_score ?? "-"}`
      : "vs";

  return (
    <div className="rounded-lg border border-border/60 bg-card/70 p-3 text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {match.round}
        </span>
        {match.status === "live" ? (
          <Badge className="bg-red-500/20 text-red-300">LIVE</Badge>
        ) : null}
        {match.status === "finished" ? (
          <Badge variant="secondary">FT</Badge>
        ) : null}
      </div>
      <div className="space-y-1 font-medium">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate">{match.team1}</span>
          {match.status !== "upcoming" ? (
            <span className="tabular-nums">{match.home_score ?? "-"}</span>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span className="truncate">{match.team2}</span>
          {match.status !== "upcoming" ? (
            <span className="tabular-nums">{match.away_score ?? "-"}</span>
          ) : (
            <span className="text-xs">{score}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function Bracket({ matches }: { matches: Match[] }) {
  const knockout = matches.filter((m) => KNOCKOUT_STAGES.includes(m.stage as typeof KNOCKOUT_STAGES[number]));

  return (
    <div className="space-y-8">
      {KNOCKOUT_STAGES.map((stage) => {
        const stageMatches = knockout.filter((m) => m.stage === stage);
        if (stageMatches.length === 0) return null;

        return (
          <section key={stage} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
              {STAGE_LABELS[stage]}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {stageMatches.map((match) => (
                <BracketMatch key={match.id} match={match} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

"use client";

import type { Match } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StandingRow {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

function computeGroupStandings(matches: Match[], groupName: string): StandingRow[] {
  const finished = matches.filter(
    (m) =>
      m.group_name === groupName &&
      m.status === "finished" &&
      m.home_score !== null &&
      m.away_score !== null
  );

  const table = new Map<string, StandingRow>();

  function ensure(team: string) {
    if (!table.has(team)) {
      table.set(team, {
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0,
      });
    }
    return table.get(team)!;
  }

  for (const match of finished) {
    const home = ensure(match.team1);
    const away = ensure(match.team2);
    const hs = match.home_score!;
    const as = match.away_score!;

    home.played += 1;
    away.played += 1;
    home.gf += hs;
    home.ga += as;
    away.gf += as;
    away.ga += hs;

    if (hs > as) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
    } else if (hs < as) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return Array.from(table.values())
    .map((row) => ({ ...row, gd: row.gf - row.ga }))
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
}

export function GroupStandings({ matches }: { matches: Match[] }) {
  const groups = Array.from(
    new Set(
      matches
        .filter((m) => m.group_name)
        .map((m) => m.group_name as string)
    )
  ).sort();

  if (groups.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          Group standings will appear once matches are synced.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.map((group) => {
        const rows = computeGroupStandings(matches, group);
        return (
          <Card key={group} className="border-border/60 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-emerald-400">{group}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2">Team</th>
                    <th className="pb-2 text-center">P</th>
                    <th className="pb-2 text-center">GD</th>
                    <th className="pb-2 text-center">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.team} className="border-t border-border/40">
                      <td className="py-2 pr-2 font-medium">{row.team}</td>
                      <td className="py-2 text-center tabular-nums">{row.played}</td>
                      <td className="py-2 text-center tabular-nums">
                        {row.gd > 0 ? `+${row.gd}` : row.gd}
                      </td>
                      <td className="py-2 text-center font-bold tabular-nums text-emerald-400">
                        {row.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

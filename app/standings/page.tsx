"use client";

import { useEffect, useState } from "react";
import { AppHeader, AppShell } from "@/components/AppShell";
import { GroupStandings } from "@/components/GroupStandings";
import type { Match } from "@/lib/types";

export default function StandingsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/matches");
        const data = await res.json();
        setMatches(data.matches ?? []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <AppShell>
      <AppHeader title="Group Standings" subtitle="Tables A through L" />
      <main className="mx-auto max-w-lg px-4 py-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading standings...</p>
        ) : (
          <GroupStandings matches={matches} />
        )}
      </main>
    </AppShell>
  );
}

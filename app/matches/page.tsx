"use client";

import { useEffect, useState } from "react";
import { AppHeader, AppShell } from "@/components/AppShell";
import { useParticipant } from "@/components/ParticipantContext";
import { MatchResults, type PredictionRow } from "@/components/MatchResults";
import type { Match } from "@/lib/types";

export default function MatchesPage() {
  const { participant } = useParticipant();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [matchesRes, predsRes] = await Promise.all([
          fetch("/api/matches?status=finished"),
          fetch("/api/predictions?reveal=true"),
        ]);

        const matchesData = await matchesRes.json();
        const predsData = await predsRes.json();

        setMatches(matchesData.matches ?? []);
        setPredictions(predsData.predictions ?? []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <AppShell>
      <AppHeader title="Results" subtitle="See how everyone called it" />
      <main className="mx-auto max-w-lg px-4 py-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading results...</p>
        ) : (
          <MatchResults
            matches={matches}
            predictions={predictions}
            participantId={participant?.id}
          />
        )}
      </main>
    </AppShell>
  );
}

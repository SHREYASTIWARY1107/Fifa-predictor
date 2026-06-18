"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader, AppShell } from "@/components/AppShell";
import { useParticipant } from "@/components/ParticipantContext";
import { MatchResults, type PredictionRow } from "@/components/MatchResults";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { Match } from "@/lib/types";

export default function MatchesPage() {
  const { participant } = useParticipant();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [matchesRes, predsRes] = await Promise.all([
        fetch("/api/matches"),
        fetch("/api/predictions?reveal=true"),
      ]);

      const matchesData = await matchesRes.json();
      const predsData = await predsRes.json();

      if (!matchesRes.ok) {
        throw new Error(matchesData.error ?? "Failed to load matches");
      }
      if (!predsRes.ok) {
        throw new Error(predsData.error ?? "Failed to load predictions");
      }

      setMatches(matchesData.matches ?? []);
      setPredictions(predsData.predictions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <AppShell>
      <AppHeader title="Results" subtitle="See how everyone called it" />
      <main className="mx-auto max-w-lg px-4 py-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading results...</p>
        ) : error ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setLoading(true);
                load();
              }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="finished">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="finished">Finished</TabsTrigger>
              <TabsTrigger value="live">Live</TabsTrigger>
            </TabsList>
            <TabsContent value="finished">
              <MatchResults
                matches={matches}
                predictions={predictions}
                participantId={participant?.id}
                mode="finished"
              />
            </TabsContent>
            <TabsContent value="live">
              <MatchResults
                matches={matches}
                predictions={predictions}
                participantId={participant?.id}
                mode="live"
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </AppShell>
  );
}

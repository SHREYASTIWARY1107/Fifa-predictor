"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader, AppShell } from "@/components/AppShell";
import { Leaderboard } from "@/components/Leaderboard";
import { useParticipant } from "@/components/ParticipantContext";
import { MatchCard } from "@/components/MatchCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Match, Prediction } from "@/lib/types";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/constants";
import { createBrowserClient } from "@/lib/supabase/client";

export default function PredictPage() {
  const { participant } = useParticipant();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!participant) return;

    try {
      const [matchesRes, predsRes] = await Promise.all([
        fetch("/api/matches"),
        fetch(`/api/predictions?participant_id=${participant.id}`),
      ]);

      const matchesData = await matchesRes.json();
      const predsData = await predsRes.json();

      setMatches(matchesData.matches ?? []);

      const map: Record<string, Prediction> = {};
      for (const p of predsData.predictions ?? []) {
        map[p.match_id] = p;
      }
      setPredictions(map);
    } finally {
      setLoading(false);
    }
  }, [participant]);

  useEffect(() => {
    load();

    const supabase = createBrowserClient();
    const channel = supabase
      .channel("predict-matches")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const today = new Date().toISOString().slice(0, 10);

  const todayMatches = useMemo(
    () =>
      matches.filter(
        (m) =>
          m.kickoff_at.slice(0, 10) === today &&
          (m.status === "upcoming" || m.status === "live")
      ),
    [matches, today]
  );

  const upcomingMatches = useMemo(
    () => matches.filter((m) => m.status === "upcoming"),
    [matches]
  );

  const byStage = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    for (const stage of STAGE_ORDER) {
      grouped[stage] = matches.filter((m) => m.stage === stage && m.status === "upcoming");
    }
    return grouped;
  }, [matches]);

  if (!participant) return null;

  function renderList(list: Match[], participantId: string) {
    if (list.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No open matches in this view.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {list.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            participantId={participantId}
            prediction={predictions[match.id]}
            onSaved={(p) => setPredictions((prev) => ({ ...prev, [match.id]: p }))}
          />
        ))}
      </div>
    );
  }

  return (
    <AppShell>
      <AppHeader title="Predict" subtitle="Lock in before kickoff" />
      <main className="mx-auto max-w-lg px-4 py-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading matches...</p>
        ) : (
          <Tabs defaultValue="today">
            <TabsList className="mb-4 grid w-full grid-cols-3">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="rounds">Rounds</TabsTrigger>
            </TabsList>

            <TabsContent value="today">{renderList(todayMatches, participant.id)}</TabsContent>
            <TabsContent value="upcoming">{renderList(upcomingMatches, participant.id)}</TabsContent>
            <TabsContent value="rounds" className="space-y-6">
              {STAGE_ORDER.map((stage) => {
                const list = byStage[stage] ?? [];
                if (list.length === 0) return null;
                return (
                  <section key={stage}>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-400">
                      {STAGE_LABELS[stage]}
                    </h2>
                    {renderList(list, participant.id)}
                  </section>
                );
              })}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </AppShell>
  );
}

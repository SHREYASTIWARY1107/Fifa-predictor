"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader, AppShell } from "@/components/AppShell";
import { Leaderboard } from "@/components/Leaderboard";
import { MatchDayBanner } from "@/components/MatchDayBanner";
import { TodayLeaderboard } from "@/components/TodayLeaderboard";
import { useLeaderboard } from "@/components/Providers";
import { useParticipant } from "@/components/ParticipantContext";
import type { LeaderboardEntry } from "@/lib/types";

export default function HomePage() {
  const { entries, loading } = useLeaderboard();
  const { participant } = useParticipant();
  const [todayEntries, setTodayEntries] = useState<LeaderboardEntry[]>([]);
  const [todayLoading, setTodayLoading] = useState(true);

  const loadToday = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard?scope=today");
      const data = await res.json();
      setTodayEntries(data.leaderboard ?? []);
    } catch {
      setTodayEntries([]);
    } finally {
      setTodayLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
    const timer = setInterval(loadToday, 60_000);
    return () => clearInterval(timer);
  }, [loadToday]);

  return (
    <AppShell>
      <AppHeader
        title="Leaderboard"
        subtitle="Who's calling the scores right?"
      />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <MatchDayBanner />
        {todayLoading ? (
          <p className="text-center text-sm text-muted-foreground">Loading today...</p>
        ) : (
          <TodayLeaderboard entries={todayEntries} />
        )}
        {loading ? (
          <p className="text-center text-muted-foreground">Loading standings...</p>
        ) : (
          <Leaderboard entries={entries} highlightId={participant?.id} />
        )}
      </main>
    </AppShell>
  );
}

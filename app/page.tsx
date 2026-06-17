"use client";

import { AppHeader, AppShell } from "@/components/AppShell";
import { Leaderboard } from "@/components/Leaderboard";
import { useLeaderboard } from "@/components/Providers";
import { useParticipant } from "@/components/ParticipantContext";

export default function HomePage() {
  const { entries, loading } = useLeaderboard();
  const { participant } = useParticipant();

  return (
    <AppShell>
      <AppHeader
        title="Leaderboard"
        subtitle="Who's calling the scores right?"
      />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading standings...</p>
        ) : (
          <Leaderboard
            entries={entries}
            highlightId={participant?.id}
          />
        )}
      </main>
    </AppShell>
  );
}

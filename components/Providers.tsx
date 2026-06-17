"use client";

import { useCallback, useEffect, useState } from "react";
import { PinGate } from "@/components/PinGate";
import { NameGate } from "@/components/NameGate";
import {
  ParticipantProvider,
  useParticipant,
} from "@/components/ParticipantContext";
import type { LeaderboardEntry, Participant } from "@/lib/types";
import { subscribeToTables } from "@/lib/supabase/realtime";

function ParticipantGate({ children }: { children: React.ReactNode }) {
  const { participant, setParticipant, loading } = useParticipant();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!participant) {
    return (
      <NameGate
        onReady={(p: Participant) =>
          setParticipant({
            id: p.id,
            display_name: p.display_name,
            avatar_color: p.avatar_color,
          })
        }
      />
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [pinVerified, setPinVerified] = useState(false);
  const handleVerified = useCallback(() => setPinVerified(true), []);

  if (!pinVerified) {
    return <PinGate onVerified={handleVerified} />;
  }

  return (
    <ParticipantProvider>
      <ParticipantGate>{children}</ParticipantGate>
    </ParticipantProvider>
  );
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setEntries(data.leaderboard ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const unsubscribe = subscribeToTables(
      "leaderboard-updates",
      [
        { event: "*", table: "predictions" },
        { event: "UPDATE", table: "matches" },
      ],
      refresh
    );

    return () => {
      unsubscribe?.();
    };
  }, [refresh]);

  return { entries, loading, refresh };
}

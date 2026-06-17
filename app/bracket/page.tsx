"use client";

import { useEffect, useState } from "react";
import { AppHeader, AppShell } from "@/components/AppShell";
import { Bracket } from "@/components/Bracket";
import type { Match } from "@/lib/types";
import { createBrowserClient } from "@/lib/supabase/client";

export default function BracketPage() {
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

    const supabase = createBrowserClient();
    const channel = supabase
      .channel("bracket-matches")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AppShell>
      <AppHeader title="Knockout Bracket" subtitle="R32 through the Final" />
      <main className="mx-auto max-w-lg px-4 py-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading bracket...</p>
        ) : (
          <Bracket matches={matches} />
        )}
      </main>
    </AppShell>
  );
}

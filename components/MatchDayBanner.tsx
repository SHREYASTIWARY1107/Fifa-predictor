"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Match } from "@/lib/types";
import { Clock } from "lucide-react";

export function MatchDayBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/matches?status=upcoming");
        const data = await res.json();
        const matches = (data.matches ?? []) as Match[];
        const now = Date.now();
        const threeHours = 3 * 60 * 60 * 1000;

        const soon = matches.filter((m) => {
          const kickoff = new Date(m.kickoff_at).getTime();
          return kickoff > now && kickoff - now <= threeHours;
        });

        if (soon.length === 0) {
          setMessage(null);
          return;
        }

        const nextKickoff = Math.min(
          ...soon.map((m) => new Date(m.kickoff_at).getTime())
        );
        const hours = Math.max(1, Math.round((nextKickoff - now) / (60 * 60 * 1000)));

        setMessage(
          `${soon.length} match${soon.length === 1 ? "" : "es"} start${
            soon.length === 1 ? "s" : ""
          } in ~${hours}h — lock in your picks`
        );
      } catch {
        setMessage(null);
      }
    }

    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, []);

  if (!message) return null;

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-emerald-200">
          <Clock className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
        <Link
          href="/predict"
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Predict
        </Link>
      </div>
    </div>
  );
}

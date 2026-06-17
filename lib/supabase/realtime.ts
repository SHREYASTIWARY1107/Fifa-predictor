"use client";

import { createBrowserClient } from "@/lib/supabase/client";

type PostgresChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export function subscribeToTable(
  channelName: string,
  table: string,
  event: PostgresChangeEvent,
  onChange: () => void
): (() => void) | undefined {
  const supabase = createBrowserClient();
  if (!supabase) return undefined;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event, schema: "public", table },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToTables(
  channelName: string,
  subscriptions: Array<{ table: string; event: PostgresChangeEvent }>,
  onChange: () => void
): (() => void) | undefined {
  const supabase = createBrowserClient();
  if (!supabase) return undefined;

  let channel = supabase.channel(channelName);
  for (const { table, event } of subscriptions) {
    channel = channel.on(
      "postgres_changes",
      { event, schema: "public", table },
      () => onChange()
    );
  }

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

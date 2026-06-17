"use client";

import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

export function createBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase client environment variables");
  }

  client = createClient(url, anonKey);
  return client;
}

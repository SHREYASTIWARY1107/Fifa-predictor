#!/usr/bin/env node
/**
 * One-time backfill: set password_hash for existing participants.
 * Usage: node scripts/backfill-passwords.mjs
 */
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);
const hash = await bcrypt.hash("12345678", 10);

const { data: participants, error } = await supabase
  .from("participants")
  .select("id, display_name, password_hash");

if (error) {
  console.error(error.message);
  process.exit(1);
}

let updated = 0;
for (const p of participants ?? []) {
  if (p.password_hash) continue;
  const { error: updateError } = await supabase
    .from("participants")
    .update({ password_hash: hash })
    .eq("id", p.id);
  if (updateError) {
    console.error(p.display_name, updateError.message);
  } else {
    updated++;
    console.log("Backfilled:", p.display_name);
  }
}

console.log(`Done. Updated ${updated} participants.`);

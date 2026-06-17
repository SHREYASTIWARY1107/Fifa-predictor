import { createClient } from "@supabase/supabase-js";
import { mapWcupMatch, fetchWcupMatches } from "../lib/match-sync";
import { hashPin } from "../lib/auth";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const leaguePin = process.env.LEAGUE_PIN ?? "1234";

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, serviceKey);
  const matches = await fetchWcupMatches();
  const mapped = matches.map(mapWcupMatch);

  const { error } = await supabase.from("matches").upsert(mapped, {
    onConflict: "external_id",
  });

  if (error) throw error;

  const pinHash = await hashPin(leaguePin);
  const { error: settingsError } = await supabase.from("league_settings").upsert(
    {
      id: 1,
      pin_hash: pinHash,
      name: "Friends WC 2026",
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (settingsError) throw settingsError;

  console.log(`Seeded ${mapped.length} matches`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

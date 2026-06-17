import { createServiceClient } from "@/lib/supabase/server";
import { hashPin } from "@/lib/auth";

export async function ensureLeagueSettings() {
  const supabase = createServiceClient();
  const leaguePin = process.env.LEAGUE_PIN;

  if (!leaguePin) {
    throw new Error("LEAGUE_PIN environment variable is required");
  }

  const { data: existing } = await supabase
    .from("league_settings")
    .select("id")
    .eq("id", 1)
    .maybeSingle();

  if (!existing) {
    const pinHash = await hashPin(leaguePin);
    const { error } = await supabase.from("league_settings").insert({
      id: 1,
      pin_hash: pinHash,
      name: "Friends WC 2026",
    });

    if (error) {
      throw new Error(`Failed to create league settings: ${error.message}`);
    }
  }
}

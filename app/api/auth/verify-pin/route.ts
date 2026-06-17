import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { setPinVerified, verifyPin } from "@/lib/auth";
import { ensureLeagueSettings } from "@/lib/league";

export async function POST(request: Request) {
  try {
    const { pin } = (await request.json()) as { pin?: string };

    if (!pin || pin.length < 4 || pin.length > 6) {
      return NextResponse.json(
        { error: "PIN must be 4-6 digits" },
        { status: 400 }
      );
    }

    await ensureLeagueSettings();

    const supabase = createServiceClient();
    const { data: settings, error } = await supabase
      .from("league_settings")
      .select("pin_hash")
      .eq("id", 1)
      .single();

    if (error || !settings) {
      return NextResponse.json(
        { error: "League settings not found" },
        { status: 500 }
      );
    }

    const valid = await verifyPin(pin, settings.pin_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    await setPinVerified();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

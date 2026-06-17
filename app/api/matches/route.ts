import { NextResponse } from "next/server";
import { isPinVerified } from "@/lib/auth";
import { syncMatchesFromApi } from "@/lib/match-sync";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const verified = await isPinVerified();
    if (!verified) {
      return NextResponse.json({ error: "PIN not verified" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    const supabase = createServiceClient();

    const { data: settings } = await supabase
      .from("league_settings")
      .select("last_synced_at")
      .eq("id", 1)
      .maybeSingle();

    const lastSynced = settings?.last_synced_at
      ? new Date(settings.last_synced_at).getTime()
      : 0;

    if (Date.now() - lastSynced > 5 * 60 * 1000) {
      try {
        await syncMatchesFromApi();
      } catch {
        // Keep serving cached DB data if sync fails.
      }
    }

    let query = supabase
      .from("matches")
      .select("*")
      .order("kickoff_at", { ascending: true });

    if (stage) query = query.eq("stage", stage);
    if (status) query = query.eq("status", status);
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      query = query.gte("kickoff_at", start.toISOString()).lte("kickoff_at", end.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ matches: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

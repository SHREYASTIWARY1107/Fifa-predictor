import { NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/auth";
import { ensureLeagueSettings } from "@/lib/league";
import { syncMatchesFromApi } from "@/lib/match-sync";

export async function POST(request: Request) {
  try {
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureLeagueSettings();
    const result = await syncMatchesFromApi();

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

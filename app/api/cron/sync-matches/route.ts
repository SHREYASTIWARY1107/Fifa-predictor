import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/auth";
import { syncMatchesFromApi } from "@/lib/match-sync";

export async function POST(request: Request) {
  try {
    if (!isAuthorizedCron(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncMatchesFromApi();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

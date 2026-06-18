import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/auth";
import { syncMatchesFromApi } from "@/lib/match-sync";

async function runSync(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncMatchesFromApi();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  try {
    return await runSync(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    return await runSync(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

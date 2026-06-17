import { NextResponse } from "next/server";
import { isPinVerified } from "@/lib/auth";

export async function GET() {
  const verified = await isPinVerified();
  return NextResponse.json({ verified });
}

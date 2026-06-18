import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import {
  DEFAULT_RECLAIM_PASSWORD,
  PARTICIPANT_COOKIE,
  PIN_COOKIE,
} from "@/lib/constants";

export async function hashPin(pin: string) {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string) {
  return bcrypt.compare(pin, hash);
}

export async function isPinVerified() {
  const cookieStore = await cookies();
  return cookieStore.get(PIN_COOKIE)?.value === "1";
}

export async function setPinVerified() {
  const cookieStore = await cookies();
  cookieStore.set(PIN_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export function isAuthorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export function isAuthorizedAdmin(request: Request) {
  return isAuthorizedCron(request);
}

export async function getParticipantSessionId() {
  const cookieStore = await cookies();
  return cookieStore.get(PARTICIPANT_COOKIE)?.value ?? null;
}

export async function setParticipantSession(participantId: string) {
  const cookieStore = await cookies();
  cookieStore.set(PARTICIPANT_COOKIE, participantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });
}

export async function verifyReclaimPassword(
  password: string,
  passwordHash: string | null
) {
  if (passwordHash) {
    return verifyPin(password, passwordHash);
  }
  return password === DEFAULT_RECLAIM_PASSWORD;
}

export async function hashReclaimPassword(password: string = DEFAULT_RECLAIM_PASSWORD) {
  return hashPin(password);
}

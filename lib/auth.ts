import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { PIN_COOKIE } from "@/lib/constants";

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

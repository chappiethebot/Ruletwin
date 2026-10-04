import "server-only";
import { cookies } from "next/headers";
import * as db from "./db.ts";

const COOKIE = "rt_session";
let instance: db.Db | null = null;
export const getDb = () => (instance ??= db.openDb());

// Hosted read-only demo (e.g. Vercel): serverless disks are not persistent, so local
// accounts and saving are disabled there; every lookup/report/change feature works.
export const HOSTED_DEMO = process.env.HOSTED_DEMO === "1";

// Identity is always derived server-side from the session cookie lookup.
export async function currentUser() {
  if (HOSTED_DEMO) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  return db.sessionUser(getDb(), token);
}

export async function startSession(userId: number) {
  const { token, expires } = db.createSession(getDb(), userId);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db.deleteSession(getDb(), token);
  jar.delete(COOKIE);
}

// Only allow same-site relative redirects after login.
export const safeNext = (n: unknown) =>
  typeof n === "string" && n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : "/app/check";

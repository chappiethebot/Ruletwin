import path from "node:path";
import fs from "node:fs";

export const ROOT = path.resolve(import.meta.dirname, "..");
loadEnv();
// Starter pack location: STARTER_DIR env var, else the folder as unzipped from the event Drive.
export const STARTER_DIR = process.env.STARTER_DIR
  ? path.resolve(process.env.STARTER_DIR)
  : path.join(ROOT, "participant-final-no-hour16 3-20261004T014511Z-1-001", "participant-final-no-hour16 3");
export const DATA_DIR = path.join(ROOT, "data");
export const CACHE_DIR = path.join(ROOT, ".cache");
export const SUBMISSION_DIR = path.join(ROOT, "submission");

export const readJson = <T>(p: string): T => JSON.parse(fs.readFileSync(p, "utf8")) as T;
export function writeJson(p: string, v: unknown) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
}

// Load .env.local without a dependency (KEY=VALUE lines; existing env wins).
export function loadEnv() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// Bounded-concurrency map.
export async function pool<T, R>(items: T[], n: number, fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

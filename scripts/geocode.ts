// Resolve each sample address to its legal incorporated place with the US Census
// Geocoder (public, no key). Results are cached in data/geocode.json; re-runs only
// query addresses not yet resolved. Usage: npm run geocode
import fs from "node:fs";
import path from "node:path";
import { parseCsv } from "../src/lib/engine/facts.ts";
import { DATA_DIR, STARTER_DIR, pool, readJson, writeJson } from "./config.ts";

export interface GeoResult {
  address_id: string;
  matched: boolean;
  matched_address: string | null;
  place: string | null; // Census incorporated place NAME, e.g. "Los Angeles city"
  county: string | null;
  lat: number | null;
  lon: number | null;
  query: string;
  retrieved_at: string;
}

const OUT = path.join(DATA_DIR, "geocode.json");
const BASE = "https://geocoding.geo.census.gov/geocoder/geographies/address";

async function lookup(params: Record<string, string>) {
  const qs = new URLSearchParams({ ...params, benchmark: "Public_AR_Current", vintage: "Current_Current", layers: "28,82", format: "json" });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${BASE}?${qs}`, { signal: AbortSignal.timeout(30000) });
      if (res.ok) return { data: (await res.json()) as any, query: qs.toString() };
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  throw new Error(`geocoder failed for ${params.street}`);
}

async function main() {
  const rows = parseCsv(fs.readFileSync(path.join(STARTER_DIR, "data", "sample_addresses.csv"), "utf8"));
  const cache: Record<string, GeoResult> = fs.existsSync(OUT) ? readJson(OUT) : {};
  const todo = rows.filter((r) => !cache[r.address_id]);
  console.log(`${rows.length} addresses, ${todo.length} to geocode`);
  let done = 0;
  await pool(todo, 4, async (r) => {
    // Postal city first (zip omitted: some sample zips are wrong); then zip-only fallback.
    // Assessor formatting variant: zero-padded ordinals and "AV" ("05TH AV" -> "5TH AVE").
    const variant = r.street_address.replace(/\b0+(\d+(?:ST|ND|RD|TH))\b/g, "$1").replace(/\bAV\b/g, "AVE");
    const attempts: Record<string, string>[] = [
      { street: r.street_address, city: r.postal_city, state: r.state },
      ...(variant !== r.street_address ? [{ street: variant, city: r.postal_city, state: r.state }] : []),
      ...(r.zip ? [{ street: r.street_address, zip: r.zip, state: r.state }] : []),
    ];
    let result: GeoResult | null = null;
    for (const a of attempts) {
      let res;
      try { res = await lookup(a); } catch (e) {
        console.warn(`${r.address_id}: ${(e as Error).message} (${a.street})`);
        continue;
      }
      const { data, query } = res;
      const m = data?.result?.addressMatches?.[0];
      if (!m) continue;
      result = {
        address_id: r.address_id, matched: true, matched_address: m.matchedAddress,
        place: m.geographies?.["Incorporated Places"]?.[0]?.NAME ?? null,
        county: m.geographies?.["Counties"]?.[0]?.NAME ?? null,
        lat: m.coordinates?.y ?? null, lon: m.coordinates?.x ?? null,
        query, retrieved_at: new Date().toISOString(),
      };
      break;
    }
    cache[r.address_id] = result ?? {
      address_id: r.address_id, matched: false, matched_address: null, place: null, county: null,
      lat: null, lon: null, query: attempts.map((a) => new URLSearchParams(a).toString()).join(" | "),
      retrieved_at: new Date().toISOString(),
    };
    if (++done % 25 === 0) { writeJson(OUT, cache); console.log(`${done}/${todo.length}`); }
  });
  writeJson(OUT, cache);
  const vals = Object.values(cache);
  console.log(`matched ${vals.filter((v) => v.matched).length}/${vals.length}; no place ${vals.filter((v) => v.matched && !v.place).length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

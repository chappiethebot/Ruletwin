// Evidence adapters. Every endpoint below is a documented public interface that was
// inspected before use (see docs/EVIDENCE_SOURCES.md for access methods and terms).
// Adapters PROPOSE records; src/lib/engine/evidence.ts validateRecord() decides.
// No adapter requests owner names or owner mailing addresses.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { validateRecord, type EvidenceRecord } from "../../src/lib/engine/evidence.ts";
import type { Property, Rule } from "../../src/lib/engine/types.ts";
import { CACHE_DIR } from "../config.ts";

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export const stats: { adapter: string; ms: number; cached: boolean; ok: boolean }[] = [];

// Cached GET with bounded retries; latency is recorded for the metrics report.
export async function getCached(adapter: string, url: string, kind: "json" | "text" | "bytes" = "json"): Promise<{ data: any; retrieved_at: string } | null> {
  const file = path.join(CACHE_DIR, "evidence", adapter, `${sha(url)}.json`);
  if (fs.existsSync(file)) {
    const c = JSON.parse(fs.readFileSync(file, "utf8"));
    stats.push({ adapter, ms: c.fetch_ms ?? 0, cached: true, ok: true }); // first-fetch latency, for the report
    return c;
  }
  const t0 = Date.now();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { "user-agent": "RuleTwin research prototype (hackathon); low volume" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = kind === "json" ? await res.json() : kind === "text" ? await res.text() : Buffer.from(await res.arrayBuffer()).toString("base64");
      const out = { data, retrieved_at: new Date().toISOString(), fetch_ms: Date.now() - t0 };
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(out));
      stats.push({ adapter, ms: Date.now() - t0, cached: false, ok: true });
      return out;
    } catch { await new Promise((r) => setTimeout(r, 1200)); }
  }
  stats.push({ adapter, ms: Date.now() - t0, cached: false, ok: false });
  return null;
}

const qs = (o: Record<string, string>) => new URLSearchParams(o).toString();
const id = (...p: string[]) => `ev-${sha(p.join("|")).slice(0, 10)}`;
const place = (n: string) => n.replace(/ (city|town|village|borough|township|CDP)$/i, "").trim();

// Street normalisation for address matching.
const SUFFIX: Record<string, string> = { ST: "STREET", AVE: "AVENUE", AV: "AVENUE", RD: "ROAD", DR: "DRIVE", BLVD: "BOULEVARD", PL: "PLACE", CT: "COURT", TER: "TERRACE", PKWY: "PARKWAY", LN: "LANE", SQ: "SQUARE", HWY: "HIGHWAY" };
export function normStreet(s: string): string {
  const words = s.toUpperCase().replace(/[.,#]/g, " ").replace(/\bLOT\b.*$/, "").split(/\s+/).filter(Boolean);
  // A leading "ST" is "SAINT" (ST JAMES ST); elsewhere it is "STREET".
  return words.map((w, i) => (w === "ST" && i === 0 && words.length > 1 ? "SAINT" : SUFFIX[w] ?? w)).join(" ").trim();
}
export const houseNumber = (s: string) => /^\s*(\d+)/.exec(s)?.[1] ?? null;
const STATE_ZIP: Record<string, RegExp> = { MA: /^0[12]\d{3}$/, NJ: /^0[78]\d{3}$/, CA: /^9[0-6]\d{3}$/ };

// ---------- Identity: Census 2020 ZCTA -> incorporated place relationship ----------
const ZCTA_URL = "https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_place20_natl.txt";
let zctaRows: Record<string, string>[] | null = null;
async function zctaTable() {
  if (zctaRows) return zctaRows;
  const file = path.join(CACHE_DIR, "evidence", "zcta_place_2020.txt");
  if (!fs.existsSync(file)) {
    const res = await fetch(ZCTA_URL);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  const [head, ...lines] = fs.readFileSync(file, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const cols = head.split("|");
  zctaRows = lines.map((l) => Object.fromEntries(l.split("|").map((v, i) => [cols[i], v])));
  return zctaRows;
}

export async function zctaCandidates(p: Property): Promise<EvidenceRecord | null> {
  const zip = p.zip.trim().slice(0, 5);
  const retrieved = fs.existsSync(path.join(CACHE_DIR, "evidence", "zcta_place_2020.txt"))
    ? fs.statSync(path.join(CACHE_DIR, "evidence", "zcta_place_2020.txt")).mtime.toISOString() : new Date().toISOString();
  const base = {
    subject: { property_id: p.address_id, level: "address" as const, key: `ZIP ${zip}` }, field: "city_candidates" as const,
    valid: { from: null, to_exclusive: null }, provenance: "automated" as const, status: "validated" as const,
  };
  if (!STATE_ZIP[p.state]?.test(zip)) {
    return validateRecord({ ...base, id: id("zcta", p.address_id), value: null,
      source: { adapter: "census-zcta-place-2020", url: ZCTA_URL, retrieved_at: retrieved, span: `ZIP ${zip}`, terms: "US Census Bureau public data" },
      match: { method: "assessor ZIP", matched: zip, confidence: "none" },
      reasons: [zip ? `ZIP ${zip} is not a ${p.state} ZIP (likely an owner mailing ZIP); not used` : "no ZIP in the assessor record"] });
  }
  const t0 = Date.now();
  const rows = (await zctaTable()).filter((r) => r.GEOID_ZCTA5_20 === zip && r.GEOID_PLACE_20);
  const total = Number(rows[0]?.AREALAND_ZCTA5_20 ?? 0);
  const parts = rows.filter((r) => Number(r.AREALAND_PART) > 0);
  const covered = parts.reduce((n, r) => n + Number(r.AREALAND_PART), 0);
  // Area of the ZCTA outside every incorporated place = unincorporated candidate.
  const cands = [...new Set(parts.map((r) => place(r.NAMELSAD_PLACE_20)))];
  if (covered < total) cands.push("(unincorporated area)");
  stats.push({ adapter: "census-zcta-place-2020", ms: Date.now() - t0, cached: true, ok: true });
  return validateRecord({ ...base, id: id("zcta", p.address_id, zip), value: cands.length ? cands : null,
    source: { adapter: "census-zcta-place-2020", url: ZCTA_URL, retrieved_at: retrieved,
      span: parts.map((r) => `${r.GEOID_ZCTA5_20}|${r.NAMELSAD_PLACE_20}|AREALAND_PART=${r.AREALAND_PART}|AREALAND_ZCTA5_20=${r.AREALAND_ZCTA5_20}`).join("\n") || `no place rows for ZCTA ${zip}`,
      terms: "US Census Bureau public data" },
    match: { method: "assessor ZIP = 2020 ZCTA (ZIP and ZCTA are not identical)", matched: zip, confidence: "candidate" },
    reasons: [`land area share: ${parts.map((r) => `${place(r.NAMELSAD_PLACE_20)} ${(100 * Number(r.AREALAND_PART) / total).toFixed(2)}%`).join(", ")}${covered < total ? `, unincorporated ${(100 * (total - covered) / total).toFixed(2)}%` : ""}`] });
}

// ---------- Identity corroboration (MA): MassGIS Master Address Data points ----------
const MAD = "https://services1.arcgis.com/hGdibHYSPO59RG1h/arcgis/rest/services/MAD_Address_Pts_for_NG911_Address_Finder_Hosted/FeatureServer/0/query";
export async function massgisStreetInZip(p: Property): Promise<{ found: boolean; span: string; url: string; retrieved_at: string } | null> {
  const street = normStreet(p.street_address.replace(/^\s*\d+[-\d]*\s*/, ""));
  const url = `${MAD}?${qs({ where: `STREET_NAME = '${street.replaceAll("'", "''")}' AND POSTAL_CODE = '${p.zip.slice(0, 5)}'`,
    outFields: "STREET_NAME,COMMUNITY,POSTAL_CODE", returnDistinctValues: "true", returnGeometry: "false", f: "json" })}`;
  const r = await getCached("massgis-mad", url);
  if (!r || r.data.error) return null;
  const feats = (r.data.features ?? []).map((f: any) => f.attributes);
  return { found: feats.length > 0, span: JSON.stringify(feats), url, retrieved_at: r.retrieved_at };
}

// ---------- Identity (NJ): NJGIN geocoder + NJ municipal boundaries (point in polygon) ----------
const NJ_GEOCODE = "https://geo.nj.gov/arcgis/rest/services/Tasks/NJ_Geocode/GeocodeServer/findAddressCandidates";
const NJ_MUNI = "https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/NJ_Municipalities_3857/FeatureServer/0/query";
export async function njMunicipality(p: Property): Promise<EvidenceRecord[]> {
  // A building listed as "600 JACKSON/601 HARRISON" is checked at every listed address; all must agree.
  const addrs = p.street_address.split("/").map((s) => s.trim())
    .map((s) => (/\b(ST|AVE|AV|RD|DR|BLVD|PL|CT|TER|LN|PKWY|WAY)\.?$/i.test(s) ? s : `${s} ST`));
  const out: EvidenceRecord[] = [];
  for (const a of addrs) {
    const gUrl = `${NJ_GEOCODE}?${qs({ SingleLine: `${a}, ${p.postal_city}, NJ`, outFields: "Match_addr,Addr_type,City,Score", outSR: "4326", maxLocations: "3", f: "json" })}`;
    const g = await getCached("njgin-geocode", gUrl);
    const c = g?.data?.candidates?.find((x: any) => x.score >= 95 && x.attributes.Addr_type === "PointAddress");
    if (!c) {
      out.push(validateRecord({ id: id("njgin", p.address_id, a), subject: { property_id: p.address_id, level: "address", key: a }, field: "city", value: null,
        valid: { from: null, to_exclusive: null }, source: { adapter: "njgin-geocoder", url: gUrl, retrieved_at: g?.retrieved_at ?? new Date().toISOString(), span: JSON.stringify(g?.data?.candidates?.slice(0, 2) ?? []), terms: "NJOGIS public service" },
        match: { method: "NJGIN PointAddress >= 95", matched: a, confidence: "none" }, provenance: "automated", status: "validated", reasons: ["no point-address match"] }));
      continue;
    }
    const { x, y } = c.location;
    const mUrl = `${NJ_MUNI}?${qs({ geometry: `${x},${y}`, geometryType: "esriGeometryPoint", inSR: "4326", spatialRel: "esriSpatialRelIntersects", outFields: "MUN,MUN_TYPE,NAME,COUNTY", returnGeometry: "false", f: "json" })}`;
    const m = await getCached("nj-municipal-boundaries", mUrl);
    const feats = m?.data?.features ?? [];
    // Exact = same house number and same street name word; anything else is too weak to use.
    const streetWord = (s: string) => normStreet(s.replace(/^\s*\d+[-\d]*\s*/, "")).split(" ")[0];
    const exact = houseNumber(c.attributes.Match_addr) === houseNumber(a) && streetWord(c.attributes.Match_addr) === streetWord(a);
    out.push(validateRecord({
      id: id("njmuni", p.address_id, a), subject: { property_id: p.address_id, level: "address", key: a }, field: "city",
      value: feats.length === 1 ? place(String(feats[0].attributes.NAME ?? feats[0].attributes.MUN)) : null,
      valid: { from: null, to_exclusive: null },
      source: { adapter: "njgin-geocoder+nj-municipal-boundaries", url: mUrl, retrieved_at: m?.retrieved_at ?? new Date().toISOString(),
        span: `geocode: ${JSON.stringify({ Match_addr: c.attributes.Match_addr, Addr_type: c.attributes.Addr_type, score: c.score, x, y })}\nmunicipality: ${JSON.stringify(feats.map((f: any) => f.attributes))}`,
        terms: "NJOGIS public services" },
      match: { method: "NJGIN PointAddress geocode, then municipal polygon containing the point", matched: c.attributes.Match_addr, confidence: exact ? "exact" : "none" },
      provenance: "automated", status: "validated", reasons: feats.length === 1 ? [] : [`point fell in ${feats.length} municipal polygons`],
    }));
  }
  // Every listed address must resolve, exactly, to the same municipality.
  const values = new Set(out.map((r) => (r.status === "validated" ? r.value : null)));
  if (values.size !== 1 || values.has(null)) for (const r of out) if (r.status === "validated") {
    r.status = "rejected"; r.reasons.push("not every listed address resolved exactly to the same municipality");
  }
  return out;
}

// ---------- Building facts (NJ): MOD-IV composite parcels (no owner fields requested) ----------
const NJ_PARCELS = "https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/Parcels_Composite_NJ_WM/FeatureServer/0/query";
export async function njModIvYear(p: Property): Promise<EvidenceRecord | null> {
  const muni = (p.city ?? p.postal_city).toUpperCase();
  const url = `${NJ_PARCELS}?${qs({ where: `PROP_LOC = '${p.street_address.replaceAll("'", "''")}' AND MUN_NAME LIKE '${muni.replaceAll("'", "''")}%'`,
    outFields: "PAMS_PIN,PROP_LOC,MUN_NAME,PROP_CLASS,BLDG_DESC,YR_CONSTR,PCLLASTUPD", returnGeometry: "false", f: "json" })}`;
  const r = await getCached("nj-modiv-parcels", url);
  if (!r) return null;
  const feats = (r.data.features ?? []).map((f: any) => f.attributes);
  const years = [...new Set(feats.map((f: any) => Number(f.YR_CONSTR)).filter((y: number) => y > 1700))] as number[];
  return validateRecord({
    id: id("modiv", p.address_id), subject: { property_id: p.address_id, level: "parcel", key: feats[0]?.PAMS_PIN ?? p.street_address },
    field: "year_built", value: years.length === 1 ? years[0] : null, valid: { from: null, to_exclusive: null },
    source: { adapter: "nj-modiv-parcels", url, retrieved_at: r.retrieved_at, span: JSON.stringify(feats), record_id: feats[0]?.PAMS_PIN, terms: "NJOGIS public service" },
    match: { method: "PROP_LOC exact + municipality", matched: feats[0]?.PROP_LOC ?? "", confidence: feats.length === 1 ? "exact" : feats.length ? "candidate" : "none" },
    provenance: "automated", status: "validated",
    reasons: !feats.length ? ["no parcel with this PROP_LOC"] : years.length ? [] : ["parcel found; YR_CONSTR empty in MOD-IV"],
  });
}

// ---------- Building facts (LA): LADBS Certificates of Occupancy (2005+) ----------
const LADBS = "https://data.lacity.org/resource/3f9m-afei.json";
export async function ladbsFirstCo(p: Property): Promise<EvidenceRecord | null> {
  const num = houseNumber(p.street_address);
  if (!num) return null;
  const street = p.street_address.replace(/^\s*\d+[-\d]*\s*/, "").replace(/^(N|S|E|W)\s+/, "").split(/\s+/)[0];
  const url = `${LADBS}?${qs({ $where: `address_start <= ${num} AND address_end >= ${num} AND upper(street_name) = '${street.toUpperCase().replaceAll("'", "''")}'`, $limit: "50" })}`;
  const r = await getCached("ladbs-cofo", url);
  if (!r) return null;
  const rows: any[] = r.data ?? [];
  // Only a new-building CO is the first certificate of occupancy; alterations/additions are not.
  const fresh = rows.filter((x) => /new/i.test(x.permit_type ?? "") && Number(x.of_residential_dwelling_units ?? 0) > 0);
  const dates = [...new Set(fresh.map((x) => String(x.cofo_issue_date).slice(0, 10)))].sort();
  return validateRecord({
    id: id("ladbs", p.address_id), subject: { property_id: p.address_id, level: "building", key: `${num} ${street}` },
    field: "co_date", value: dates.length === 1 ? dates[0] : null, valid: { from: dates[0] ?? null, to_exclusive: null },
    source: { adapter: "ladbs-cofo", url, retrieved_at: r.retrieved_at, record_id: fresh[0]?.cofo_number,
      span: JSON.stringify(fresh.length ? fresh.map((x) => ({ cofo_number: x.cofo_number, cofo_issue_date: x.cofo_issue_date, permit_type: x.permit_type, units: x.of_residential_dwelling_units })) : rows.slice(0, 3).map((x) => ({ cofo_number: x.cofo_number, permit_type: x.permit_type }))),
      terms: "City of Los Angeles open data, public domain (CC0)" },
    match: { method: "house number within address range + street name", matched: `${num} ${street}`, confidence: dates.length === 1 ? "normalized" : "none" },
    provenance: "automated", status: "validated",
    reasons: dates.length > 1 ? [`${dates.length} new-building COs; ambiguous`] : !fresh.length ? ["no new-building CO in LADBS records (dataset starts 2005; absence proves nothing about older buildings)"] : [],
  });
}

// ---------- Legal versions: San Diego Municipal Code (official codified text with history notes) ----------
// Section 98.1101 lives in Chapter 9, Article 8, Division 11.
export function sdmcUrl(citation: string): string | null {
  const m = /\b(\d)(\d)\.(\d{2})\d{2}\b/.exec(citation);
  return m ? `https://docs.sandiego.gov/municode/MuniCodeChapter0${m[1]}/Ch0${m[1]}Art0${m[2]}Division${m[3]}.pdf` : null;
}
export async function sdmcHistory(rule: Rule, pdfText: (b64: string) => Promise<string>): Promise<EvidenceRecord[]> {
  const url = sdmcUrl(rule.citation);
  if (!url || !rule.jurisdiction.startsWith("San Diego")) return [];
  const r = await getCached("sdmc-pdf", url, "bytes");
  if (!r) return [];
  const text = (await pdfText(r.data)).replace(/\s+/g, " ");
  // Anchor to the cited section: the history note must lie between that section number
  // and the next section number; otherwise nothing is claimed.
  const sec = /\b(\d{2}\.\d{4})\b/.exec(rule.citation)?.[1];
  const at = sec ? text.indexOf(sec) : -1;
  if (!sec || at < 0) return [];
  const rest = text.slice(at + sec.length);
  const next = rest.search(/\b\d{2}\.\d{4}\b/);
  const scope = text.slice(at, next < 0 ? undefined : at + sec.length + next);
  const m = /added (\d{1,2})-(\d{1,2})-(\d{4}) by (O-\d+ N\.S\.); effective (\d{1,2})-(\d{1,2})-(\d{4})\./.exec(scope);
  if (!m) return [];
  const eff = `${m[7]}-${m[5].padStart(2, "0")}-${m[6].padStart(2, "0")}`;
  const span = m[0];
  const common = {
    subject: { rule_id: rule.team_rule_id, level: "law" as const, key: rule.citation }, valid: { from: null, to_exclusive: null },
    source: { adapter: "sdmc-codified-history", url, retrieved_at: r.retrieved_at, span, record_id: m[4], terms: "City of San Diego official municipal code" },
    match: { method: "SDMC section number in citation", matched: url, confidence: "exact" as const }, provenance: "automated" as const, status: "validated" as const, reasons: [],
  };
  return [
    validateRecord({ ...common, id: id("sdmc-status", rule.team_rule_id), field: "rule_status", value: "enacted" }),
    validateRecord({ ...common, id: id("sdmc-eff", rule.team_rule_id), field: "rule_effective_date", value: eff }),
  ];
}

// ---------- Identity: municipal assessor roll membership ----------
// A city's own assessor roll lists only parcels inside that city, so a row's source
// dataset is evidence of legal municipality. County/regional/state rolls are excluded.
const MUNICIPAL_ROLLS: Record<string, { city: string; url: string }> = {
  "Cambridge Property Database FY2026 (waa7-ibdu)": { city: "Cambridge", url: "https://data.cambridgema.gov/d/waa7-ibdu" },
  "Boston Property Assessment FY2026": { city: "Boston", url: "https://data.boston.gov/dataset/property-assessment" },
  "DataSF wv5m-vpq2 (2025 roll)": { city: "San Francisco", url: "https://data.sfgov.org/d/wv5m-vpq2" },
};
export function assessorRollCity(p: Property): EvidenceRecord | null {
  const roll = MUNICIPAL_ROLLS[p.raw.source_dataset];
  if (!roll) return null;
  const row = ["address_id", "street_address", "postal_city", "state", "zip", "source_dataset", "retrieved_at"].map((k) => p.raw[k]).join(",");
  return validateRecord({
    id: id("roll", p.address_id), subject: { property_id: p.address_id, level: "parcel", key: p.street_address }, field: "city", value: roll.city,
    valid: { from: null, to_exclusive: null },
    source: { adapter: "municipal-assessor-roll", url: roll.url, retrieved_at: p.raw.retrieved_at || new Date().toISOString(), span: row, terms: "Supplied sample (public assessor data)" },
    match: { method: "row belongs to the city's own assessor roll", matched: p.street_address, confidence: "exact" },
    provenance: "automated", status: "validated", reasons: [],
  });
}

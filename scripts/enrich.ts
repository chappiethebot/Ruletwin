// Evidence-resolution loop over all sample properties:
//   evaluate -> identify decisive gaps -> retrieve evidence -> validate -> reevaluate
//   -> targeted clarification.
// Adapters run only for gaps that decide at least one result (or an unresolved
// city), at most once per property and source per run; responses are cached.
// Usage: node scripts/enrich.ts [--as-of 2026-10-01]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { applyLegalEvidence, applyPropertyEvidence, validateRecord, type EvidenceRecord } from "../src/lib/engine/evidence.ts";
import { resolveProperty } from "../src/lib/engine/resolve.ts";
import type { Property, Rule } from "../src/lib/engine/types.ts";
import { consolidate, loadProperties } from "./publish.ts";
import { assessorRollCity, ladbsFirstCo, massgisStreetInZip, njModIvYear, njMunicipality, sdmcHistory, stats, zctaCandidates } from "./evidence/adapters.ts";
import { DATA_DIR, pool, readJson, writeJson } from "./config.ts";

const EV_DIR = path.join(DATA_DIR, "evidence");

function pdfText(b64: string): Promise<string> {
  const r = spawnSync("python", ["-c", "import sys,base64,io,pypdf;r=pypdf.PdfReader(io.BytesIO(base64.b64decode(sys.stdin.read())));print('\\n'.join(p.extract_text() or '' for p in r.pages))"],
    { input: b64, encoding: "utf8", maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error(`pdf text extraction failed (needs Python + pypdf): ${r.stderr.slice(0, 200)}`);
  return Promise.resolve(r.stdout);
}

// Human-verified records (e.g. ZIMAS RSO status read by a reviewer) live in
// data/evidence/verified/*.json as arrays of partial EvidenceRecords.
export function loadVerifiedImports(): EvidenceRecord[] {
  const dir = path.join(EV_DIR, "verified");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).flatMap((f) =>
    (readJson<Partial<EvidenceRecord>[]>(path.join(dir, f))).map((r) => validateRecord({
      id: `vi-${crypto.createHash("sha256").update(JSON.stringify(r)).digest("hex").slice(0, 10)}`,
      valid: { from: null, to_exclusive: null }, reasons: [], status: "validated",
      match: { method: "human verified", matched: "", confidence: "exact" },
      ...r, provenance: "verified_import",
    } as EvidenceRecord)));
}

function byAdapterOf(st: typeof stats) {
  const out: Record<string, { calls: number; cached: number; failed: number; median_ms: number | null; p95_ms: number | null; measured: number }> = {};
  for (const a of [...new Set(st.map((s) => s.adapter))]) {
    const xs = st.filter((s) => s.adapter === a);
    const ms = xs.map((s) => s.ms).filter(Boolean).sort((x, y) => x - y);
    out[a] = { calls: xs.length, cached: xs.filter((s) => s.cached).length, failed: xs.filter((s) => !s.ok).length,
      median_ms: ms.length ? ms[Math.floor(ms.length / 2)] : null, p95_ms: ms.length ? ms[Math.floor(ms.length * 0.95)] : null, measured: ms.length };
  }
  return out;
}

const countUnknown = (rs: ReturnType<typeof resolveProperty>) => rs.evaluations.filter((e) => e.result === "unknown").length;

async function main() {
  const args = process.argv.slice(2);
  const asOf = args.includes("--as-of") ? args[args.indexOf("--as-of") + 1] : "2026-10-01";
  const rules0: Rule[] = consolidate(readJson(path.join(DATA_DIR, "extraction", "candidates.json")));
  const props = loadProperties();
  const records: EvidenceRecord[] = [];

  // 1. Legal versions: official codified histories for rules whose version is missing or pending.
  for (const r of rules0) records.push(...(await sdmcHistory(r, pdfText)));
  records.push(...loadVerifiedImports());
  const { rules } = applyLegalEvidence(rules0, records);
  const legalChanged = rules.filter((r, i) => r.logic.status_kind !== rules0[i].logic.status_kind || r.effective_date !== rules0[i].effective_date);

  // 2. Properties.
  const summary: Record<string, unknown>[] = [];
  const audit: Record<string, unknown>[] = [];
  await pool(props, 4, async (p0: Property) => {
    const before0 = resolveProperty(rules0, p0, asOf); // baseline: no legal evidence, no property evidence
    const before = resolveProperty(rules, p0, asOf);
    const gaps = new Set(before.questions.map((q) => q.id));
    const mine: EvidenceRecord[] = [];
    const tried: string[] = [];

    // Municipal assessor roll membership: exact city evidence (also cross-checks the geocoder).
    const roll = assessorRollCity(p0);
    if (roll) { tried.push("municipal-assessor-roll"); mine.push(roll); }
    if (p0.city === null && !roll) {
      tried.push("census-zcta-place-2020");
      const z = await zctaCandidates(p0);
      if (z && p0.state === "MA" && z.status === "validated") {
        tried.push("massgis-mad");
        const c = await massgisStreetInZip(p0);
        if (c && !c.found) { z.status = "rejected"; z.reasons.push(`MassGIS MAD has no ${p0.street_address} in ZIP ${p0.zip}; ZIP not corroborated`); }
        if (c?.found) { z.reasons.push(`corroborated: street exists in ZIP ${p0.zip} per MassGIS MAD ${c.span}`); z.match.method += "; corroborated street-in-ZIP"; }
      }
      if (z) mine.push(z);
      if (p0.state === "NJ") { tried.push("njgin-geocoder+nj-municipal-boundaries"); mine.push(...(await njMunicipality(p0))); }
    }
    if (gaps.has("fact:co_date") || gaps.has("fact:year_built")) {
      if (p0.city === "Los Angeles") { tried.push("ladbs-cofo"); const r = await ladbsFirstCo(p0); if (r) mine.push(r); }
      if (p0.state === "NJ" && p0.facts.year_built?.state === "missing") { tried.push("nj-modiv-parcels"); const r = await njModIvYear(p0); if (r) mine.push(r); }
    }
    records.push(...mine);
    const applied = applyPropertyEvidence(p0, [...mine, ...records.filter((r) => r.provenance === "verified_import")], asOf);
    const after = resolveProperty(rules, applied.property, asOf);
    summary.push({
      address_id: p0.address_id, unknown_baseline: countUnknown(before0), unknown_after_legal: countUnknown(before), unknown_after_evidence: countUnknown(after),
      sources_tried: tried, evidence_used: applied.used, evidence_ignored: applied.ignored, conflicts: applied.conflicts,
      questions: after.questions.map((q) => ({ id: q.id, kind: q.kind, question: q.question, decides: q.decisive_for.length })),
    });
    if (p0.city === null || applied.conflicts.length) {
      audit.push({
        address_id: p0.address_id, address: `${p0.street_address}, ${p0.postal_city}, ${p0.state} ${p0.zip}`,
        original: p0.city_evidence,
        evidence: mine.filter((r) => r.field.startsWith("city")).map((r) => ({ id: r.id, adapter: r.source.adapter, value: r.value, status: r.status, reasons: r.reasons, span: r.source.span.slice(0, 400) })),
        outcome: applied.property.city ? `resolved: ${applied.property.city}` : applied.property.city_candidates ? `ambiguous: ${applied.property.city_candidates.join(" | ")}` : "unresolved",
        city_evidence: applied.property.city_evidence,
        unknown_before: countUnknown(before), unknown_after: countUnknown(after),
        shared_conclusions: after.evaluations.filter((e) => e.result !== "unknown" && e.result !== "not_applicable").length,
        request: after.questions.find((q) => q.id === "city")?.question ?? null,
      });
    }
  });

  summary.sort((a, b) => String(a.address_id).localeCompare(String(b.address_id)));
  writeJson(path.join(EV_DIR, "records.json"), records.sort((a, b) => a.id.localeCompare(b.id)));
  writeJson(path.join(EV_DIR, "enrichment.json"), { as_of: asOf, generated_at: new Date().toISOString(), legal_versions_changed: legalChanged.map((r) => r.team_rule_id), properties: summary });
  const latency = Object.fromEntries(Object.entries(byAdapterOf(stats)).map(([k, v]) => [k, v]));
  writeJson(path.join(EV_DIR, "latency.json"), latency);
  writeJson(path.join(EV_DIR, "address-audit.json"), audit.sort((a, b) => String(a.address_id).localeCompare(String(b.address_id))));

  const sum = (k: string) => summary.reduce((n, s) => n + (s[k] as number), 0);
  const byAdapter: Record<string, { calls: number; cached: number; failed: number; ms: number[] }> = {};
  for (const s of stats) { const a = (byAdapter[s.adapter] ??= { calls: 0, cached: 0, failed: 0, ms: [] }); a.calls++; if (s.cached) a.cached++; if (!s.ok) a.failed++; if (s.ms) a.ms.push(s.ms); }
  const status: Record<string, number> = {};
  for (const r of records) status[`${r.source.adapter}:${r.status}`] = (status[`${r.source.adapter}:${r.status}`] ?? 0) + 1;
  console.log(`unknown rule results: baseline ${sum("unknown_baseline")} -> legal evidence ${sum("unknown_after_legal")} -> property evidence ${sum("unknown_after_evidence")}`);
  console.log("legal versions changed:", legalChanged.map((r) => `${r.team_rule_id} ${r.citation}`));
  console.log("records:", status);
  for (const [k, v] of Object.entries(byAdapter)) {
    const ms = v.ms.sort((a, b) => a - b);
    console.log(`  ${k}: ${v.calls} calls, ${v.cached} cached, ${v.failed} failed, first-fetch latency median ${ms[Math.floor(ms.length / 2)] ?? "n/a"} ms, p95 ${ms[Math.floor(ms.length * 0.95)] ?? "n/a"} ms (${ms.length} measured)`);
  }
  for (const a of audit) console.log(`  audit ${a.address_id}: ${a.outcome} (unknown ${a.unknown_before} -> ${a.unknown_after})`);
}

if (import.meta.main) main();

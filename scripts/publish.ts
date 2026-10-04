// Build an immutable snapshot from extraction candidates + property facts, run
// every property through the evaluator, export the official submission files,
// then atomically switch data/snapshots/active.json. The previous snapshot stays
// on disk for rollback/comparison.
// Usage: npm run publish [-- --as-of 2026-10-01] [-- --tests <change_tests.json>] [-- --dry-run]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { officialStatus } from "../src/lib/engine/engine.ts";
import { applyLegalEvidence, applyPropertyEvidence, validateRecord, type EvidenceRecord } from "../src/lib/engine/evidence.ts";
import { resolveProperty } from "../src/lib/engine/resolve.ts";
import { factsFromRow, parseCsv } from "../src/lib/engine/facts.ts";
import { runChange, type ChangeTest } from "../src/lib/engine/changes.ts";
import type { Property, Rule } from "../src/lib/engine/types.ts";
import { PROMPT_VERSION, loadManifest, type Candidate, type LedgerEntry } from "./extract.ts";
import type { GeoResult } from "./geocode.ts";
import { DATA_DIR, ROOT, STARTER_DIR, SUBMISSION_DIR, readJson, writeJson } from "./config.ts";

export const ENGINE_VERSION = "engine-v1";
const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

// Law key for de-duplication across documents. Bill numbers identify pending bills;
// otherwise the section after "§" (or chapter / first number). City codes are keyed
// at chapter level ("§ 37.9" and "ch. 37" -> "37"); NJ-style "2A:18-61.3" -> "2a:18-61".
// City laws named "... Ordinance" are keyed by that name (city/filler words removed),
// ahead of section numbers: "L.A.M.C. ch. XV (Rent Stabilization Ordinance)" and
// "... (Rent Stabilization Ordinance), § 151.00" are the same law.
const NAME_FILLER = /\b(santa|ana|los|angeles|san|francisco|diego|berkeley|jersey|hoboken|newark|boston|cambridge|city|of|the|and|for|municipal|code|ordinance)\b/g;
export function ordinanceName(c: string): string | null {
  const m = /((?:[A-Z][A-Za-z-]*\s+(?:and\s+|for\s+|of\s+)?)+Ordinance)\b/.exec(c);
  if (!m) return null;
  const words = [...new Set(m[1].toLowerCase().replace(NAME_FILLER, " ").split(/\s+/).filter(Boolean))].sort();
  return words.length ? words.join(" ") : null;
}

export function lawKey(c: string, level: string): string {
  const bill = /\b([SHA])\.?\s?(\d{3,5})\b/i.exec(c);
  if (bill) return `${bill[1].toUpperCase()}${bill[2]}`;
  const name = level === "city" ? ordinanceName(c) : null;
  if (name) return `name:${name}`;
  const sec = /§+\s*([0-9][0-9a-z.:\-]*)/i.exec(c)?.[1]
    ?? /\b(?:ch\.|chapter)\s*([0-9][0-9a-z.:\-]*)/i.exec(c)?.[1]
    ?? /\b(\d{2,}[0-9a-z.:\-]*)/i.exec(c)?.[1] ?? c;
  const k = sec.toLowerCase().replace(/[.:\-]+$/, "");
  if (level === "city") return k.split(/[.\-]/)[0];
  return /[:-]/.test(k) ? k.replace(/\.\d+[a-z]?$/, "") : k;
}

// Normalize extracted exemptions that no data field can test:
//  - "covered by local rent control / local ordinance" is a precedence relation,
//    not a property fact: convert to yields_to_local (evaluated against real local rules);
//  - other untestable exemptions become disclosed presumptions (see Exemption type).
const LOCAL_LAW = /local|rent (control|stabiliz)|\bRSO\b|rent ordinance|city ordinance|just cause ordinance/i;
// Policy switch (audit F17): by default, untestable exemptions are disclosed presumptions
// (matching the brief's illustrative output); STRICT_EXEMPTIONS=1 keeps them unknown.
export const STRICT_EXEMPTIONS = process.env.STRICT_EXEMPTIONS === "1";

export function normalizeExemptions(exs: Candidate["exemption_logic"], review: string[], strict = STRICT_EXEMPTIONS) {
  let yields = false;
  const out: Rule["logic"]["exemptions"] = [];
  for (const e of exs) {
    const untestable = e.all.length > 0 && e.all.every((a) => a.field === "other");
    if (untestable && LOCAL_LAW.test(`${e.label} ${e.all.map((a) => `${a.description} ${a.value}`).join(" ")}`)) {
      yields = true;
      review.push(`exemption "${e.label}" treated as precedence (yields to same-category local rule)`);
      continue;
    }
    if (untestable) review.push(strict ? `exemption "${e.label}" not determinable from data; kept unknown (strict mode)`
      : `exemption "${e.label}" not determinable from data; presumed not to apply (disclosed)`);
    out.push({ label: e.label, all: e.all, quote: e.quote, ...(untestable && !strict ? { presumed_inapplicable: true } : {}) });
  }
  return { exemptions: out, yields };
}

// A year-built cutoff whose own source quote states a full date ("first built on or
// before October 1, 1978") keeps that day precision, so the cutoff year stays unknown.
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
export function fullDateIn(text: string, year: string): string | null {
  const iso = new RegExp(`\\b${year}-\\d{2}-\\d{2}\\b`).exec(text)?.[0];
  if (iso) return iso;
  const m = new RegExp(`\\b(${MONTHS.join("|")})\\s+(\\d{1,2}),?\\s+${year}\\b`, "i").exec(text);
  return m ? `${year}-${String(MONTHS.indexOf(m[1].toLowerCase()) + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}` : null;
}
// Typed-fact table for recurring untyped predicates whose statutory wording defines a
// property type (audit F18/F20: replace `other` with source-backed typed facts).
// Each entry maps the statute's own phrasing; truth for "yes" stays the same.
const TYPED_PREDICATES: { re: RegExp; field: string; op: string; value: string; basis: string }[] = [
  { re: /alienable separate(ly)? from (the )?title to any other dwelling unit/i, field: "property_type", op: "in", value: "single_family|condominium",
    basis: "Cal. Civ. Code §§ 1946.2(e)(8), 1947.12(d)(5): separately alienable dwelling = single-family home or condominium unit" },
  { re: /(owner[- ]occupied|owner (resides|lives)).{0,80}(rent(ing|s)? (a room |rooms )?to (no more than )?one (additional )?(person|roomer|boarder))|(rent(ing|s)? (a room |rooms )?to (no more than )?one (additional )?(person|roomer|boarder)).{0,80}owner/i,
    field: "property_type", op: "eq", value: "single_family",
    basis: "Cal. Gov. Code § 12927(c)(2)(A)-style roomer exemption: owner-occupied single-family dwelling renting to one person" },
  { re: /rent(s|ing)? (a room |rooms |a portion of (the|a) (home|dwelling) )?to (only |no more than )?one (additional )?(person|roomer|boarder|lodger)/i,
    field: "property_type", op: "eq", value: "single_family",
    basis: "roomer exemption: renting part of a single-family home to one person" },
];

// A condition requiring coverage by the very ordinance the rule belongs to is
// self-referential (the rule's own scope), not an external fact.
export function selfReferential(description: string, rule: { title: string; citation: string }): boolean {
  if (!/covered by/i.test(description)) return false;
  const own = ordinanceName(`${rule.title} ${rule.citation}`), ref = ordinanceName(description);
  return Boolean(own && ref && ref.split(" ").every((w) => own.split(" ").includes(w)));
}
function normalizeAtoms<T extends { field: string; op: string; value: string; quote: string; description: string }>(atoms: T[], review: string[]): T[] {
  return atoms.map((a) => {
    if (a.field === "other") {
      const hit = TYPED_PREDICATES.find((t) => t.re.test(`${a.description} ${a.value} ${a.quote}`));
      if (!hit) return a;
      review.push(`untyped predicate "${a.description}" typed as ${hit.field} ${hit.op} ${hit.value} (${hit.basis})`);
      return { ...a, field: hit.field, op: hit.op, value: hit.value };
    }
    if (a.field !== "year_built" || !/^\d{4}$/.test(a.value) || !["le", "lt", "ge", "gt"].includes(a.op)) return a;
    const d = fullDateIn(`${a.quote} ${a.description}`, a.value);
    if (!d) return a;
    review.push(`year-built cutoff ${a.op} ${a.value} kept at day precision ${d} (from its source quote)`);
    return { ...a, value: d };
  });
}

const rank = (c: Candidate) => (/^official/.test(c.source_type) ? 2 : 0) + c.confidence + (c.review.length ? -0.2 : 0);

// A team-captured supplementary page (S*) may only support rules for the jurisdictions
// listed in its own manifest row; anything else it mentions is not used.
export const droppedSupplementary: string[] = [];
function allowedSource(c: Candidate, manifest: ReturnType<typeof loadManifest>): boolean {
  if (!/^S\d/.test(c.doc_id)) return true;
  const jur = (manifest.find((m) => m.doc_id === c.doc_id)?.jurisdictions ?? "").split(/;\s*/).map((s) => s.trim());
  return jur.includes(c.jurisdiction);
}

export function consolidate(cands: Candidate[]): Rule[] {
  const groups = new Map<string, Candidate[]>();
  const manifest = loadManifest();
  droppedSupplementary.length = 0;
  const keyed = cands.filter((c) => allowedSource(c, manifest) || (droppedSupplementary.push(`${c.doc_id}: ${c.jurisdiction} ${c.citation}`), false))
    .map((c) => ({ c, lk: lawKey(c.citation, c.level) }));
  // Same city + category: an ordinance whose name words are a subset of another's
  // ("rent stabilization" vs "rent stabilization and just cause eviction") is the same law.
  const names = keyed.map((x) => x.lk);
  keyed.forEach((x, i) => {
    if (!names[i].startsWith("name:")) return;
    const words = names[i].slice(5).split(" ");
    const sup = keyed.map((y, j) => ({ y, k: names[j] }))
      .filter(({ y, k }) => y.c.jurisdiction === x.c.jurisdiction && y.c.category === x.c.category && k.startsWith("name:") && words.every((w) => k.slice(5).split(" ").includes(w)))
      .sort((a, b) => b.k.length - a.k.length)[0];
    if (sup) x.lk = sup.k;
  });
  for (const { c, lk } of keyed) {
    // Bills keep their stage in the key (each bill is its own proposal); other laws merge stages ("*").
    const k = [c.jurisdiction, c.category, /^[SHA]\d+$/.test(lk) ? c.status_kind : "*", lk].join("|");
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }
  const rules: Rule[] = [];
  for (const [gk, all] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    // One non-bill law seen at different legislative stages: a document showing an
    // earlier stage (pending) does not contradict later adoption or failure.
    const stages = [...new Set(all.map((c) => c.status_kind))];
    const status = stages.includes("failed") ? "failed" : stages.includes("enacted") ? "enacted" : "pending";
    const g = all.filter((c) => c.status_kind === status);
    const k = gk.replace("|*|", `|${status}|`);
    const stageNote = stages.length > 1
      ? `Stage merge: ${all.filter((c) => c.status_kind !== status).map((c) => `${c.doc_id} shows ${c.status_kind}`).join(", ")}; ${g.map((c) => c.doc_id).join(", ")} show${g.length === 1 ? "s" : ""} ${status}.` : null;
    const best = [...g].sort((a, b) => rank(b) - rank(a))[0];
    // Coverage logic comes from the most specific extraction (most atoms), since a
    // summary page often omits cutoffs another document states.
    const atoms = (c: Candidate) => c.conditions.reduce((n, x) => n + x.any.length, 0) + c.exemption_logic.reduce((n, x) => n + x.all.length, 0);
    const logicSrc = [...g].sort((a, b) => atoms(b) - atoms(a) || rank(b) - rank(a))[0];
    const dates = [...new Set(g.map((c) => c.effective_date).filter(Boolean))] as string[];
    const review = [...new Set(g.flatMap((c) => c.review))];
    const dateConflict = dates.length > 1
      ? `Sources disagree on effective date: ${g.filter((c) => c.effective_date).map((c) => `${c.effective_date} (${c.doc_id})`).join(" vs ")}; using ${best.effective_date ?? dates[0]} from ${best.doc_id}.`
      : null;
    if (dateConflict) review.push(dateConflict);
    if (stageNote) review.push(stageNote);
    if (logicSrc !== best) review.push(`coverage conditions taken from ${logicSrc.doc_id}; quote from ${best.doc_id}`);
    for (const e of logicSrc.exemption_logic) if (!e.all.length) review.push(`exemption "${e.label}" has no testable property condition (text only; not evaluated)`);
    if (logicSrc.conditions.some((x) => !x.any.length)) review.push("empty condition group ignored");
    const conflictNote = [best.conflict_note, dateConflict].filter(Boolean).join(" ") || null;
    const norm = normalizeExemptions(logicSrc.exemption_logic, review);
    rules.push({
      team_rule_id: `r-${sha(k).slice(0, 6)}`,
      jurisdiction: best.jurisdiction, level: best.level, category: best.category,
      status: "in_force", // set per as-of date below
      title: best.title, requirement: best.requirement, key_value: best.key_value,
      ...(best.penalty !== undefined ? { penalty: best.penalty } : {}),
      ...(best.requirement_es ? { requirement_es: best.requirement_es } : {}),
      coverage_conditions: best.coverage_conditions, exemptions: best.exemptions,
      overrides: [], interaction: best.interaction,
      effective_date: best.effective_date ?? dates[0] ?? null,
      citation: best.citation, source_doc_id: best.doc_id, source_url: best.source_url,
      quoted_span: best.quoted_span, confidence: Math.round(best.confidence * 100) / 100,
      conflict_flag: g.some((c) => c.conflict_with_local) || Boolean(dateConflict), conflict_note: conflictNote,
      logic: {
        status_kind: best.status_kind,
        conditions: logicSrc.conditions.map((x) => ({ any: normalizeAtoms(x.any, review) }))
          .filter((x) => {
            const self = x.any.length > 0 && x.any.every((a) => a.field === "other" && selfReferential(a.description, best));
            if (self) review.push(`self-referential condition removed: "${x.any.map((a) => a.description).join(" / ")}" (rule is part of that ordinance)`);
            return !self;
          }),
        exemptions: norm.exemptions.map((e) => ({ ...e, all: normalizeAtoms(e.all, review) })),
        yields_to_local: norm.yields || g.some((c) => c.yields_to_local), conflict_with_local: g.some((c) => c.conflict_with_local),
        ...(dates.length > 1 ? { disputed_effective_dates: dates.filter((d) => d !== (best.effective_date ?? dates[0])) } : {}),
      },
      source: { doc_id: best.doc_id, url: best.source_url, retrieved_at: best.retrieved_at, source_type: best.source_type, ...best.span },
      extraction: {
        model: best.model, prompt_version: PROMPT_VERSION, chunk_hash: best.chunk_hash,
        review: [...review, ...(g.length > 1 ? [`merged ${g.length} extractions: ${g.map((c) => c.doc_id).join(", ")}`] : [])],
      },
    });
  }
  // overrides: ids of same-category rules this one yields to or may conflict with (direction in `interaction`).
  for (const r of rules) {
    if (!(r.logic.yields_to_local || r.logic.conflict_with_local)) continue;
    const st = r.level === "state" ? r.jurisdiction : r.jurisdiction.split(", ")[1];
    r.overrides = rules.filter((o) => o !== r && o.level === "city" && o.category === r.category && !o.logic.yields_to_local
      && (r.level === "state" ? o.jurisdiction.endsWith(`, ${st}`) : o.jurisdiction === r.jurisdiction))
      .map((o) => o.team_rule_id);
  }
  return rules;
}

// A geocode is only accepted if the matched house number lies within the input's
// number range ("322-322.5" -> 322..322.5; "600 JACKSON/601 HARRISON" -> 600 or 601).
export function houseNumberMatches(input: string, matched: string): boolean {
  const got = Number(/^\s*(\d+(?:\.\d+)?)/.exec(matched)?.[1]);
  if (!Number.isFinite(got)) return false;
  return input.split(/[/&]/).some((part) => {
    const m = /^\s*(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/.exec(part);
    if (!m) return false;
    const lo = Number(m[1]), hi = m[2] ? Number(m[2]) : lo;
    return got >= Math.min(lo, hi) && got <= Math.max(lo, hi);
  });
}

export function loadProperties(): Property[] {
  const rows = parseCsv(fs.readFileSync(path.join(STARTER_DIR, "data", "sample_addresses.csv"), "utf8"));
  const geo: Record<string, GeoResult> = readJson(path.join(DATA_DIR, "geocode.json"));
  return rows.map((r) => {
    const g = geo[r.address_id];
    const numberOk = g?.matched ? houseNumberMatches(r.street_address, g.matched_address ?? "") : false;
    const place = g?.matched && numberOk && g.place ? g.place.replace(/ (city|town|village|borough|township)$/i, "") : null;
    return {
      address_id: r.address_id, street_address: r.street_address, postal_city: r.postal_city, state: r.state, zip: r.zip,
      raw: r, city: place, county: g?.matched && numberOk ? g.county ?? null : null,
      city_evidence: !g ? "not geocoded"
        : !g.matched ? "Census Geocoder found no match (address lacks a house number or is ambiguous); postal city is not proof of legal city"
        : !numberOk ? `Census Geocoder match rejected: matched "${g.matched_address}" does not carry house number of "${r.street_address}"`
        : !g.place ? "Census Geocoder match lies outside any incorporated place"
        : `Census Geocoder: ${g.matched_address} → ${g.place}, ${g.county}`,
      facts: factsFromRow(r),
    };
  });
}

function main() {
  const args = process.argv.slice(2);
  const asOf = args.includes("--as-of") ? args[args.indexOf("--as-of") + 1] : "2026-10-01";
  const testsFile = args.includes("--tests") ? args[args.indexOf("--tests") + 1] : path.join(STARTER_DIR, "dev", "change_tests.json");
  const dry = args.includes("--dry-run");

  const cands: Candidate[] = readJson(path.join(DATA_DIR, "extraction", "candidates.json"));
  const ledger: LedgerEntry[] = readJson(path.join(DATA_DIR, "extraction", "ledger.json"));
  // Validated legal-version evidence (official legislative histories) updates rule versions.
  const evFile = path.join(DATA_DIR, "evidence", "records.json");
  const evidence: EvidenceRecord[] = fs.existsSync(evFile) ? readJson(evFile) : [];
  const rules = applyLegalEvidence(consolidate(cands), evidence).rules;
  for (const r of rules) r.status = officialStatus(r, asOf);
  const props = loadProperties();
  const extraTests = fs.existsSync(path.join(DATA_DIR, "extra_change_tests.json")) ? readJson<ChangeTest[]>(path.join(DATA_DIR, "extra_change_tests.json")) : [];
  const supplied: ChangeTest[] = readJson<ChangeTest[]>(testsFile);
  const tests: ChangeTest[] = [...supplied, ...extraTests];
  // The official changes.json covers exactly the supplied test cases; extension cases
  // (scripts/ingest.ts) are kept in the snapshot for the website only.
  const officialTestIds = new Set(supplied.map((t) => t.test_id));

  // Validation gates: nothing is written unless every contract holds.
  const problems = publishGates(rules, props, cands, ledger, evidence, asOf);
  if (problems.length) { console.error(`Not publishing (${problems.length} problems):\n` + problems.slice(0, 40).join("\n")); process.exit(1); }

  // Constraint-aware resolution: only proven determinations replace Kleene "unknown".
  // Property evidence is applied per query date (validity intervals); only validated records count.
  const enriched = props.map((p) => applyPropertyEvidence(p, evidence, asOf).property);
  const resolved = Object.fromEntries(enriched.map((p) => [p.address_id, resolveProperty(rules, p, asOf)]));
  const evaluations = Object.fromEntries(Object.entries(resolved).map(([k, v]) => [k, v.evaluations]));
  const methods: Record<string, number> = {};
  for (const r of Object.values(resolved)) for (const e of r.evaluations) if (e.resolution.method !== "data" || e.result === "unknown")
    methods[e.resolution.method] = (methods[e.resolution.method] ?? 0) + 1;
  console.log("resolution:", methods, "limit reached on", Object.values(resolved).filter((r) => r.limit_reached).length, "properties");
  // Change cases evaluate each date through the same evidence + resolution path as reports.
  const changes = tests.map((t) => runChange(t, rules, props, undefined, evidence));

  // Snapshot = content-addressed bundle. The id hashes every decision input: rules,
  // facts, evidence, tests, ledger, cited source texts and the engine source itself.
  const docIds = [...new Set(cands.map((c) => c.doc_id))].sort();
  const docText = Object.fromEntries(docIds.map((d) => [d, fs.readFileSync(path.join(ROOT, cands.find((x) => x.doc_id === d)!.text_path), "utf8")]));
  const engineDir = path.join(ROOT, "src", "lib", "engine");
  const engineHash = sha(fs.readdirSync(engineDir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts")).sort()
    .map((f) => f + fs.readFileSync(path.join(engineDir, f), "utf8")).join("\u0000"));
  const contentHash = sha(JSON.stringify({ rules, props, evidence, tests, ledger, asOf, engineHash, strict: STRICT_EXEMPTIONS,
    docs: Object.fromEntries(Object.entries(docText).map(([d, t]) => [d, sha(t)])) }));
  const id = `snap-${contentHash.slice(0, 12)}`;
  const dir = path.join(DATA_DIR, "snapshots", id);
  const snapshot = {
    id, content_sha256: contentHash, engine_sha256: engineHash, exemption_policy: STRICT_EXEMPTIONS ? "strict" : "disclosed-presumption",
    created_at: new Date().toISOString(), engine_version: ENGINE_VERSION, default_as_of: asOf,
    rule_count: rules.length, property_count: props.length,
    documents: Object.fromEntries(ledger.map((l) => [l.doc_id, l])),
    rules, properties: props, changes, evidence,
    address_audit: fs.existsSync(path.join(DATA_DIR, "evidence", "address-audit.json")) ? readJson(path.join(DATA_DIR, "evidence", "address-audit.json")) : [],
  };
  console.log(`${rules.length} rules (${cands.length} candidates), ${props.length} properties`);
  const counts: Record<string, number> = {};
  for (const evs of Object.values(evaluations)) for (const e of evs) counts[e.result] = (counts[e.result] ?? 0) + 1;
  console.log("results:", counts);
  for (const c of changes) console.log(`${c.test_id}: ${c.affected.length} affected, ${c.conflict_flag_address_ids.length} conflict-flagged, rules ${c.matched_rule_ids.join(",") || "none"}`);
  if (dry) return;

  if (fs.existsSync(dir)) {
    // Same id = same content: never overwrite an existing bundle.
    const existing = readJson<{ content_sha256?: string }>(path.join(dir, "snapshot.json"));
    if (existing.content_sha256 !== contentHash) { console.error(`Refusing to overwrite ${id}: existing bundle has different content.`); process.exit(1); }
    console.log(`${id} already published with identical content; not rewritten.`);
  } else {
    // Stage the complete bundle, then move it into place in one rename.
    const tmp = `${dir}.staging`;
    fs.rmSync(tmp, { recursive: true, force: true });
    writeJson(path.join(tmp, "snapshot.json"), snapshot);
    for (const [d, t] of Object.entries(docText)) fs.writeFileSync(path.join(tmp, `${d}.txt`), t);
    fs.renameSync(tmp, dir);
  }

  // A team-captured copy of a manifest link-only page is cited by that manifest's doc_id
  // (same URL), so citations resolve against the organizer manifest.
  const norm = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const manifest = loadManifest();
  const manifestId = (docId: string, url: string) =>
    /^S\d/.test(docId) ? manifest.find((m) => /^D\d/.test(m.doc_id) && m.url === url)?.doc_id
      ?? manifest.find((m) => /^D\d/.test(m.doc_id) && norm(m.url) === norm(url))?.doc_id ?? docId : docId;
  const official = rules.map(({ logic, source, extraction, requirement_es, ...o }) =>
    ({ ...o, source_doc_id: o.source_doc_id ? manifestId(o.source_doc_id, o.source_url) : o.source_doc_id, source_in_supplied_corpus: inCorpus(source.doc_id) }));
  // Every exported answer names its source, retrieval date and as-of date (audit trail).
  const byRule = new Map(rules.map((r) => [r.team_rule_id, r]));
  const sourceLine = (id: string) => {
    const r = byRule.get(id)!;
    const where = inCorpus(r.source.doc_id) ? r.source.doc_id
      : `team-captured copy of link-only ${manifestId(r.source.doc_id, r.source.url)}; not supplied corpus text`;
    return ` Source: ${r.citation} (${where}, retrieved ${(r.source.retrieved_at ?? "unknown").slice(0, 10)}); as of ${asOf}.`;
  };
  writeJson(path.join(SUBMISSION_DIR, "rules.json"), { rules: official });
  writeJson(path.join(SUBMISSION_DIR, "lookups.json"), {
    as_of: asOf,
    lookups: Object.fromEntries(Object.entries(evaluations).map(([aid, evs]) => [aid,
      evs.filter((e) => e.result !== "not_applicable").map((e) => ({
        team_rule_id: e.rule_id, result: e.result, explanation: e.explanation + sourceLine(e.rule_id), conflict_flag: e.conflict_flag,
      }))])),
  });
  writeJson(path.join(SUBMISSION_DIR, "changes.json"), Object.fromEntries(changes.filter((c) => officialTestIds.has(c.test_id)).map((c) => [c.test_id, {
    affected_address_ids: c.affected.map((a) => a.address_id),
    conflict_flag_address_ids: c.conflict_flag_address_ids,
    notes: c.notes,
  }])));
  // Reproducibility log: what produced these exports and how to rerun it.
  const sha256File = (p: string) => (fs.existsSync(p) ? sha(fs.readFileSync(p, "utf8")) : null);
  const resultsCount: Record<string, number> = {};
  for (const evs of Object.values(evaluations)) for (const e of evs) if (e.result !== "not_applicable") resultsCount[e.result] = (resultsCount[e.result] ?? 0) + 1;
  writeJson(path.join(SUBMISSION_DIR, "audit_log.json"), {
    snapshot: id, content_sha256: contentHash, engine_sha256: engineHash, engine_version: ENGINE_VERSION, as_of: asOf,
    exemption_policy: STRICT_EXEMPTIONS ? "strict" : "disclosed-presumption",
    inputs: {
      starter_pack: path.relative(ROOT, STARTER_DIR).replaceAll("\\", "/"),
      corpus_manifest_sha256: sha256File(path.join(STARTER_DIR, "corpus", "corpus_manifest.csv")),
      sample_addresses_sha256: sha256File(path.join(STARTER_DIR, "data", "sample_addresses.csv")),
      change_tests_sha256: sha256File(path.join(STARTER_DIR, "dev", "change_tests.json")),
      documents: Object.fromEntries(Object.entries(docText).map(([d, t]) => [d, { sha256: sha(t), in_supplied_corpus: inCorpus(d) }])),
      geocode_cache_sha256: sha256File(path.join(DATA_DIR, "geocode.json")),
      evidence_records: evidence.length,
    },
    extraction: { prompt_version: PROMPT_VERSION, models: [...new Set(rules.map((r) => r.extraction.model))], candidates: cands.length,
      ledger: Object.fromEntries(Object.entries(ledger.reduce<Record<string, number>>((m, l) => ({ ...m, [l.disposition.split(" ")[0]]: (m[l.disposition.split(" ")[0]] ?? 0) + 1 }), {}))) },
    outputs: {
      rules: rules.length, rules_outside_supplied_corpus: rules.filter((r) => !inCorpus(r.source.doc_id)).map((r) => r.team_rule_id),
      lookup_results: resultsCount,
      changes: Object.fromEntries(changes.filter((c) => officialTestIds.has(c.test_id)).map((c) => [c.test_id, { affected: c.affected.length, conflict_flags: c.conflict_flag_address_ids.length }])),
      extension_cases: changes.filter((c) => !officialTestIds.has(c.test_id)).map((c) => c.test_id),
      rules_json_sha256: sha256File(path.join(SUBMISSION_DIR, "rules.json")),
      lookups_json_sha256: sha256File(path.join(SUBMISSION_DIR, "lookups.json")),
      changes_json_sha256: sha256File(path.join(SUBMISSION_DIR, "changes.json")),
    },
    reproduce: ["npm install", "node scripts/extract.ts   (served from .cache/llm when cached)", "node scripts/enrich.ts", "npm run publish", "npm test", "npm run build && npm run start", "npm run e2e"],
    disclaimer: "Legal information, not legal advice.",
  });
  // Atomic pointer switch (write temp, rename).
  const active = path.join(DATA_DIR, "snapshots", "active.json");
  const cur = fs.existsSync(active) ? readJson<{ id: string; previous: string | null }>(active) : null;
  const prev = cur && cur.id !== id ? cur.id : cur?.previous ?? null; // never point "previous" at itself
  writeJson(active + ".tmp", { id, previous: prev, published_at: snapshot.created_at });
  fs.renameSync(active + ".tmp", active);
  console.log(`published ${id} (previous: ${prev ?? "none"}); exports in ${path.relative(ROOT, SUBMISSION_DIR)}/`);
}

export const STUB_MARK = "FULL TEXT NOT REDISTRIBUTED";
// Supplied corpus documents are D###; S### are team-captured supplementary pages.
export const inCorpus = (docId: string) => /^D\d+$/.test(docId);

// Never exported: engine logic, provenance and the internal Spanish text.
const INTERNAL_FIELDS = ["logic", "source", "extraction", "requirement_es"];
// Declared extension: Module A requires penalties; the supplied schema has no such
// property but does not forbid additional ones.
const EXTENSION_FIELDS: Record<string, { type: string[] }> = {
  penalty: { type: ["string", "null"] },
  // false = quoted from a team-captured copy of a link-only page, not supplied corpus text
  // (allowed for research; does not count toward the citation metric).
  source_in_supplied_corpus: { type: ["boolean"] },
};

// Publication contracts (exported for tests). Returns problems; empty = publishable.
export function publishGates(rules: Rule[], props: Property[], cands: Candidate[], ledger: LedgerEntry[], evidence: EvidenceRecord[], asOf: string): string[] {
  const problems: string[] = [];
  const schema = readJson<{ required: string[]; properties: Record<string, { enum?: string[]; pattern?: string; minLength?: number; type?: string | string[]; items?: { type: string }; minimum?: number; maximum?: number }> }>(
    path.join(STARTER_DIR, "schema", "rule_record.schema.json"));
  if (!rules.length) problems.push("no rules");
  if (new Set(rules.map((r) => r.team_rule_id)).size !== rules.length) problems.push("duplicate team_rule_id");
  if (props.length < 500) problems.push(`only ${props.length} properties`);
  if (new Set(props.map((p) => p.address_id)).size !== props.length) problems.push("duplicate address_id");
  for (const r of rules) {
    const o = Object.fromEntries(Object.entries({ ...r, status: officialStatus(r, asOf) }).filter(([k]) => !INTERNAL_FIELDS.includes(k)));
    for (const k of schema.required) if (o[k] === undefined || o[k] === null || o[k] === "") problems.push(`${r.team_rule_id}: missing required ${k}`);
    for (const [k, v] of Object.entries(o)) {
      const p = schema.properties[k] ?? EXTENSION_FIELDS[k];
      if (!p) { problems.push(`${r.team_rule_id}: field ${k} not in official schema`); continue; }
      // Enforce the types and constraints used by the supplied rule schema.
      const type = v === null ? "null" : Array.isArray(v) ? "array" : typeof v;
      if (p.type && !(Array.isArray(p.type) ? p.type : [p.type]).includes(type)) problems.push(`${r.team_rule_id}: ${k} has invalid type ${type}`);
      if (p.items && Array.isArray(v) && v.some((item) => typeof item !== p.items!.type)) problems.push(`${r.team_rule_id}: ${k} has invalid array item type`);
      if (typeof v === "number" && (!Number.isFinite(v) || (p.minimum !== undefined && v < p.minimum) || (p.maximum !== undefined && v > p.maximum))) problems.push(`${r.team_rule_id}: ${k} is outside numeric bounds`);
      if (p.enum && !p.enum.includes(v as string)) problems.push(`${r.team_rule_id}: ${k}="${v}" not in enum`);
      if (p.pattern && typeof v === "string" && !new RegExp(p.pattern).test(v)) problems.push(`${r.team_rule_id}: ${k} fails pattern`);
      if (p.minLength && typeof v === "string" && v.length < p.minLength) problems.push(`${r.team_rule_id}: ${k} too short`);
    }
    // The exported quote must be the exact bytes at its recorded offsets in the source file.
    const c = cands.find((x) => x.doc_id === r.source.doc_id);
    const text = c ? fs.readFileSync(path.join(ROOT, c.text_path), "utf8") : "";
    // Public releases replace copyrighted third-party pages with a stub listing the exact
    // spans used (see scripts/public-stubs.ts); there the quote must appear verbatim in the stub.
    const stub = text.includes(STUB_MARK);
    if (stub ? !text.includes(r.quoted_span) : text.slice(r.source.start, r.source.end) !== r.quoted_span)
      problems.push(`${r.team_rule_id}: quoted_span does not match ${r.source.doc_id}${stub ? " (stub)" : `[${r.source.start}:${r.source.end}]`}`);
  }
  const errs = ledger.filter((l) => l.disposition === "error");
  if (errs.length && process.env.ALLOW_PARTIAL !== "1") problems.push(`extraction errors in ${errs.map((l) => l.doc_id).join(", ")} (set ALLOW_PARTIAL=1 to publish anyway)`);
  for (const e of evidence) {
    const again = validateRecord({ ...e, status: "validated" }); // adds reasons only for current failures
    if (again.status !== e.status) problems.push(`evidence ${e.id}: persisted status ${e.status} but re-validation gives ${again.status}`);
  }
  return problems;
}

if (import.meta.main) main();

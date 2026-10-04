// Evidence records: externally retrieved or human-verified facts about a property
// or a law, with exact supporting spans, provenance and a validity interval.
// Only records that pass validation AND are valid on the query date may change a
// fact; everything else is kept for audit but cannot alter a determination.
import { coBound } from "./facts.ts";
import type { Fact, Property, Rule } from "./types.ts";

export type EvidenceField =
  | "city" // legal municipality (exact)
  | "city_candidates" // admissible municipalities (string[])
  | "co_date" // first certificate of occupancy (new construction only)
  | "year_built"
  | "units"
  | "rso_status" // LA: property has >= 1 RSO unit ("yes") — property level, current only
  | "rule_status" // law: enacted | pending | failed
  | "rule_effective_date";

export interface EvidenceRecord {
  id: string;
  subject: { property_id?: string; rule_id?: string; level: "address" | "parcel" | "building" | "unit" | "law"; key: string };
  field: EvidenceField;
  value: string | number | string[] | null; // null = searched, nothing found
  valid: { from: string | null; to_exclusive: string | null }; // when the fact holds
  source: { adapter: string; url: string; retrieved_at: string; span: string; record_id?: string; terms: string };
  match: { method: string; matched: string; confidence: "exact" | "normalized" | "candidate" | "none" };
  provenance: "automated" | "verified_import";
  status: "validated" | "rejected" | "inconclusive";
  reasons: string[];
  latency_ms?: number;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
// A real calendar date (rejects 2026-02-30, which Date.parse would roll over).
export const isCalendarDate = (s: unknown): s is string =>
  typeof s === "string" && DATE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
const STATUS_KINDS = ["enacted", "pending", "failed"];

// Structural and semantic checks. Adapters propose; this decides.
export function validateRecord(r: EvidenceRecord): EvidenceRecord {
  const reasons = [...r.reasons];
  const bad = (m: string) => reasons.push(m);
  if (!/^https?:\/\//.test(r.source.url)) bad("source URL missing or not http(s)");
  if (!r.source.retrieved_at || Number.isNaN(Date.parse(r.source.retrieved_at))) bad("retrieval time missing");
  if (!r.source.span || r.source.span.length < 3) bad("no exact supporting span");
  if (r.provenance === "verified_import" && !/reviewer:/i.test(r.reasons.join(" ") + r.source.record_id)) bad("verified import lacks a named reviewer");
  if (r.value === null) {
    return { ...r, status: "inconclusive", reasons: [...reasons, "absence from a searched source is not proof (sources are incomplete)"] };
  }
  switch (r.field) {
    case "co_date":
    case "rule_effective_date":
      if (!isCalendarDate(r.value)) bad("date value is not a real calendar date");
      break;
    case "rule_status":
      if (!STATUS_KINDS.includes(String(r.value))) bad(`rule status must be one of ${STATUS_KINDS.join("/")}`);
      break;
    case "city":
      if (typeof r.value !== "string" || !r.value.trim()) bad("city must be a non-empty name");
      break;
    case "year_built":
    case "units":
      if (typeof r.value !== "number" || !Number.isInteger(r.value) || r.value <= 0) bad("numeric value malformed");
      break;
    case "city_candidates":
      if (!Array.isArray(r.value) || !r.value.length) bad("candidate list empty");
      break;
    case "rso_status":
      if (r.value !== "yes" && r.value !== "no") bad("RSO status must be yes/no");
      break;
  }
  // Property facts need an exact or normalized address/parcel match; candidates only for city_candidates.
  if (r.subject.property_id && r.field !== "city_candidates" && !["exact", "normalized"].includes(r.match.confidence)) bad(`match too weak (${r.match.confidence})`);
  // Legal-version records must target a rule, at law level, with an exact source match.
  const legal = r.field === "rule_status" || r.field === "rule_effective_date";
  if (legal && (!r.subject.rule_id || r.subject.level !== "law" || r.subject.property_id)) bad("legal record must target one rule at law level");
  if (legal && r.match.confidence !== "exact") bad("legal record needs an exact source match");
  if (!legal && !r.subject.property_id) bad("property record lacks a property id");
  for (const d of [r.valid.from, r.valid.to_exclusive]) if (d !== null && !isCalendarDate(d)) bad(`validity bound "${d}" is not a calendar date`);
  if (r.valid.from && r.valid.to_exclusive && r.valid.from >= r.valid.to_exclusive) bad("validity interval is empty");
  return { ...r, status: reasons.length > r.reasons.length ? "rejected" : "validated", reasons };
}

const validAt = (r: EvidenceRecord, asOf: string) =>
  (!r.valid.from || r.valid.from <= asOf) && (!r.valid.to_exclusive || asOf < r.valid.to_exclusive);

export interface AppliedEvidence { property: Property; used: string[]; ignored: { id: string; reason: string }[]; conflicts: string[] }

// Overlay validated, currently-valid evidence on a property. Conflicting scalar
// property facts become missing; retaining an old known value would overclaim.
export function applyPropertyEvidence(p: Property, records: EvidenceRecord[], asOf: string): AppliedEvidence {
  const mine = records.filter((r) => r.subject.property_id === p.address_id);
  const used: string[] = [], conflicts: string[] = [];
  const ignored = mine.filter((r) => r.status !== "validated").map((r) => ({ id: r.id, reason: `${r.status}: ${r.reasons.join("; ")}` }));
  const live = mine.filter((r) => r.status === "validated");
  for (const r of live.filter((x) => !validAt(x, asOf)))
    ignored.push({ id: r.id, reason: `not valid on ${asOf} (valid ${r.valid.from ?? "…"} to ${r.valid.to_exclusive ?? "…"}); a current record says nothing about earlier dates` });
  const byField = new Map<string, EvidenceRecord[]>();
  for (const r of live.filter((x) => validAt(x, asOf))) byField.set(r.field, [...(byField.get(r.field) ?? []), r]);

  const facts = { ...p.facts };
  let { city, city_evidence, city_candidates } = p;
  let cityDisputed = false;
  const disputeCity = (rs: EvidenceRecord[], conflict: string) => {
    city_candidates = [...new Set([...(city ? [city] : []), ...(city_candidates ?? []), ...rs.map((r) => r.value).filter((v): v is string => typeof v === "string")])];
    city = null; cityDisputed = true; city_evidence = `unresolved conflicting evidence: ${conflict}`;
  };
  const fact = (r: EvidenceRecord, f: Partial<Fact>): Fact =>
    ({ state: "known", source: `${r.source.adapter} (${r.id})`, note: `evidence ${r.id}, retrieved ${r.source.retrieved_at.slice(0, 10)}`, ...f });

  for (const [field, rs] of byField) {
    const values = new Set(rs.map((r) => JSON.stringify(field === "city_candidates" ? [...(r.value as string[])].sort() : r.value)));
    if (values.size > 1 && field !== "city_candidates") {
      const conflict = `${field}: ${rs.map((r) => `${r.id}=${JSON.stringify(r.value)}`).join(" vs ")}`;
      conflicts.push(conflict);
      ignored.push(...rs.map((r) => ({ id: r.id, reason: `unresolved conflicting evidence: ${conflict}` })));
      if (field === "units" || field === "year_built" || field === "co_date") {
        facts[field] = { state: "missing", source: "conflicting evidence", note: conflict };
        if (field === "year_built" && facts.co_date?.note?.startsWith("bounded from"))
          facts.co_date = { state: "missing", source: "conflicting evidence", note: "construction-year conflict invalidates its derived CO bound" };
      }
      if (field === "city") disputeCity(rs, conflict);
      continue;
    }
    const r = rs[0];
    switch (field) {
      case "city":
        if (city !== null && city !== r.value) {
          const conflict = `city: geocoder ${city} vs ${r.id}=${r.value}`;
          conflicts.push(conflict); ignored.push({ id: r.id, reason: conflict }); disputeCity(rs, conflict); continue;
        }
        city = r.value as string; city_evidence = `${r.source.adapter}: ${r.match.matched} (${r.id})`; break;
      case "city_candidates": {
        if (cityDisputed) {
          ignored.push(...rs.map((r) => ({ id: r.id, reason: "candidate filtering cannot resolve conflicting exact municipality claims" })));
          continue;
        }
        if (city !== null) continue; // an exact resolution already exists
        // Intersect candidate sets: each record is a necessary condition.
        const sets = rs.map((x) => new Set(x.value as string[]));
        const inter = [...sets[0]].filter((c) => sets.every((s) => s.has(c)));
        if (!inter.length) { conflicts.push(`city_candidates: no common candidate (${rs.map((x) => x.id).join(", ")})`); continue; }
        // ZIP and ZCTA are not identical: a single candidate becomes the city only when the
        // location was independently corroborated; otherwise "another municipality" stays open.
        const corroborated = rs.every((x) => /corroborated/.test(x.match.method));
        if (inter.length === 1 && corroborated) { city = inter[0]; city_evidence = `admissible-candidate evidence leaves one municipality: ${rs.map((x) => `${x.source.adapter} (${x.id})`).join(" + ")}`; }
        else {
          city_candidates = corroborated ? inter : [...inter, "another municipality (ZIP evidence not corroborated)"];
          city_evidence = `ambiguous: candidates ${city_candidates.join(", ")} (${rs.map((x) => x.id).join(", ")})`;
        }
        break;
      }
      case "co_date":
        facts.co_date = fact(r, { lo: r.value as string, hi: r.value as string }); break;
      case "year_built": {
        const y = r.value as number;
        facts.year_built = fact(r, { lo: y, hi: y });
        if (!byField.has("co_date")) { const [lo, hi] = coBound(y); facts.co_date = fact(r, { state: "presumed", lo, hi, note: `bounded from evidence year built ${y} (${r.id}); presumed, not a CO record` }); }
        break;
      }
      case "units":
        facts.units = fact(r, { lo: r.value as number, hi: r.value as number }); break;
      case "rso_status":
        // Property-level "yes" means at least one unit is RSO; it does not establish
        // the status of any particular unit, and "no" is not used as a negative.
        break;
    }
    used.push(...rs.map((x) => x.id));
  }
  return { property: { ...p, facts, city, city_evidence, city_candidates }, used, ignored, conflicts };
}

// Legal-version evidence (official legislative history) on rule copies.
// Records are re-validated here: a persisted "validated" label is not trusted. Two
// validated records disagreeing on a rule's status or date are a dispute: neither wins;
// the date alternatives become a disputed legal version the resolver must branch on.
export function applyLegalEvidence(rules: Rule[], records: EvidenceRecord[]): { rules: Rule[]; used: string[]; conflicts: string[] } {
  const used: string[] = [], conflicts: string[] = [];
  const out = rules.map((rule) => {
    const rs = records.filter((r) => r.subject.rule_id === rule.team_rule_id).map(validateRecord).filter((r) => r.status === "validated");
    if (!rs.length) return rule;
    const pick = (field: EvidenceField) => [...new Set(rs.filter((r) => r.field === field).map((r) => String(r.value)))];
    const statuses = pick("rule_status"), dates = pick("rule_effective_date");
    const disputed: string[] = [];
    if (statuses.length > 1) disputed.push(`status: ${statuses.join(" vs ")}`);
    if (dates.length > 1) disputed.push(`effective date: ${dates.join(" vs ")}`);
    if (disputed.length) conflicts.push(`${rule.team_rule_id}: ${disputed.join("; ")}`);
    const status = statuses.length === 1 ? (statuses[0] as Rule["logic"]["status_kind"]) : undefined;
    const eff = dates.length === 1 ? dates[0] : undefined;
    used.push(...rs.map((r) => r.id));
    return {
      ...rule,
      effective_date: eff ?? rule.effective_date,
      logic: {
        ...rule.logic, status_kind: status ?? rule.logic.status_kind,
        ...(dates.length > 1 ? { disputed_effective_dates: dates.filter((d) => d !== rule.effective_date) } : {}),
      },
      conflict_flag: rule.conflict_flag || disputed.length > 0,
      conflict_note: disputed.length ? [rule.conflict_note, `Official sources disagree (${disputed.join("; ")}).`].filter(Boolean).join(" ") : rule.conflict_note,
      extraction: { ...rule.extraction, review: [...rule.extraction.review,
        `legal version from evidence ${rs.map((r) => `${r.id} (${r.source.url})`).join(", ")}: ${[status && `status ${status}`, eff && `effective ${eff}`, ...disputed].filter(Boolean).join(", ")}`] },
    };
  });
  return { rules: out, used, conflicts };
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { applyLegalEvidence, applyPropertyEvidence, isCalendarDate, validateRecord, type EvidenceRecord } from "./evidence.ts";
import { factsFromRow } from "./facts.ts";
import { evalAtom } from "./engine.ts";
import type { Property, Rule } from "./types.ts";

const prop = (o: Record<string, string> = {}, city: string | null = null): Property => {
  const r = { address_id: "P1", street_address: "1 A ST", postal_city: "X", state: "MA", zip: "02124", year_built: "", units: "", use_code: "", use_description: "", source_dataset: "t", ...o };
  return { ...r, raw: r, city, city_evidence: "t", facts: factsFromRow(r) } as Property;
};
const rec = (o: Partial<EvidenceRecord>): EvidenceRecord => validateRecord({
  id: "e1", subject: { property_id: "P1", level: "building", key: "k" }, field: "year_built", value: 1950,
  valid: { from: null, to_exclusive: null },
  source: { adapter: "test", url: "https://example.gov/x", retrieved_at: "2026-10-04T00:00:00Z", span: '{"YR":1950}', terms: "public" },
  match: { method: "address", matched: "1 A ST", confidence: "exact" }, provenance: "automated", status: "validated", reasons: [], ...o,
});

test("invalid calendar dates reject without throwing at query and evidence boundaries", () => {
  for (const date of ["2026-13-01", "2026-00-01", "2026-01-32", "2026-02-30", "1900-02-29", "not-a-date"]) {
    assert.equal(isCalendarDate(date), false);
    assert.equal(rec({ field: "co_date", value: date }).status, "rejected");
    assert.equal(rec({ valid: { from: date, to_exclusive: null } }).status, "rejected");
  }
  assert.equal(isCalendarDate("2000-02-29"), true);
});

test("validated evidence sets the fact and re-bounds the CO date", () => {
  const a = applyPropertyEvidence(prop(), [rec({})], "2026-10-01");
  assert.equal(a.property.facts.year_built?.lo, 1950);
  assert.equal(a.property.facts.co_date?.lo, "1950-01-01");
  assert.deepEqual(a.used, ["e1"]);
});

test("absence from a searched source is inconclusive and changes nothing", () => {
  const r = rec({ value: null });
  assert.equal(r.status, "inconclusive");
  assert.equal(applyPropertyEvidence(prop(), [r], "2026-10-01").property.facts.year_built?.state, "missing");
});

test("weak match, missing span, bad URL are rejected and unused", () => {
  for (const bad of [rec({ match: { method: "street", matched: "A ST", confidence: "candidate" } }), rec({ source: { adapter: "t", url: "ftp://x", retrieved_at: "2026-10-04", span: "x", terms: "" } })]) {
    assert.equal(bad.status, "rejected");
    const a = applyPropertyEvidence(prop(), [bad], "2026-10-01");
    assert.equal(a.used.length, 0);
    assert.equal(a.property.facts.year_built?.state, "missing");
  }
});

test("a current record is not applied to earlier dates", () => {
  const r = rec({ field: "units", value: 12, valid: { from: "2026-10-04", to_exclusive: null } });
  assert.equal(applyPropertyEvidence(prop(), [r], "2026-10-01").property.facts.units?.state, "missing");
  assert.equal(applyPropertyEvidence(prop(), [r], "2026-10-05").property.facts.units?.lo, 12);
});

test("conflicting validated sources leave the fact open and are reported", () => {
  const a = applyPropertyEvidence(prop(), [rec({ id: "a", value: 1950 }), rec({ id: "b", value: 1962 })], "2026-10-01");
  assert.equal(a.property.facts.year_built?.state, "missing");
  assert.equal(a.conflicts.length, 1);
});

test("conflicting counts invalidate a known original fact without mutating it", () => {
  const p = prop({ units: "20" });
  const records = [rec({ id: "two", field: "units", value: 2 }), rec({ id: "twenty", field: "units", value: 20 })];
  for (const rs of [records, [...records].reverse()]) {
    const a = applyPropertyEvidence(p, rs, "2026-10-01");
    assert.equal(a.property.facts.units?.state, "missing");
    assert.equal(evalAtom({ field: "units", op: "gt", value: "2", negate: false, description: "more than two units", quote: "" }, a.property.facts, "2026-10-01").truth, "unknown");
    assert.equal(a.conflicts.length, 1);
    assert.deepEqual(a.used, []);
    assert.equal(a.ignored.length, 2);
    assert.equal(p.facts.units?.lo, 20);
  }
});

test("a year conflict clears its derived CO bound but preserves independent CO evidence", () => {
  const p = prop({ year_built: "1950" });
  const conflicts = [rec({ id: "old", value: 1950 }), rec({ id: "new", value: 1962 })];
  const a = applyPropertyEvidence(p, conflicts, "2026-10-01");
  assert.equal(a.property.facts.year_built?.state, "missing");
  assert.equal(a.property.facts.co_date?.state, "missing");
  const co = rec({ id: "co", field: "co_date", value: "1965-06-01" });
  for (const rs of [[...conflicts, co], [co, ...conflicts]]) {
    const b = applyPropertyEvidence(p, rs, "2026-10-01");
    assert.equal(b.property.facts.year_built?.state, "missing");
    assert.equal(b.property.facts.co_date?.lo, "1965-06-01");
    assert.deepEqual(b.used, ["co"]);
  }
});

test("municipality conflicts retain alternatives and cannot keep a known legal city", () => {
  const p = prop({}, "Boston");
  const boston = rec({ id: "bos", field: "city", value: "Boston" });
  const quincy = rec({ id: "qui", field: "city", value: "Quincy" });
  const candidate = rec({ id: "candidate", field: "city_candidates", value: ["Boston"], match: { method: "zcta", matched: "02124", confidence: "candidate" } });
  for (const rs of [[quincy], [boston, quincy], [boston, quincy, candidate], [candidate, quincy, boston]]) {
    const a = applyPropertyEvidence(p, rs, "2026-10-01");
    assert.equal(a.property.city, null);
    assert.deepEqual(a.property.city_candidates?.slice().sort(), ["Boston", "Quincy"]);
    assert.equal(a.conflicts.length, 1);
    assert.equal(p.city, "Boston");
  }
});

test("candidate sets intersect; a single survivor resolves the city only when corroborated", () => {
  const c = (id: string, v: string[], method = "zcta; corroborated street-in-ZIP") =>
    rec({ id, field: "city_candidates", value: v, match: { method, matched: "02124", confidence: "candidate" } });
  const one = applyPropertyEvidence(prop(), [c("z", ["Boston", "Quincy"]), c("s", ["Boston"])], "2026-10-01");
  assert.equal(one.property.city, "Boston");
  // ZIP is not ZCTA: uncorroborated ZIP evidence keeps "another municipality" open.
  const weak = applyPropertyEvidence(prop(), [c("z", ["Boston"], "zcta")], "2026-10-01");
  assert.equal(weak.property.city, null);
  assert.ok(weak.property.city_candidates?.some((x) => x.startsWith("another municipality")));
  const two = applyPropertyEvidence(prop(), [c("z", ["Hoboken", "Jersey City"])], "2026-10-01");
  assert.equal(two.property.city, null);
  assert.deepEqual(two.property.city_candidates, ["Hoboken", "Jersey City"]);
});

test("legal evidence: invalid status/date/subject rejected; conflicting records do not pick a winner", () => {
  const legal = (o: Partial<EvidenceRecord>) => rec({ subject: { rule_id: "x", level: "law", key: "k" }, ...o });
  assert.equal(legal({ field: "rule_status", value: "not-a-status" }).status, "rejected");
  assert.equal(legal({ field: "rule_effective_date", value: "2026-02-30" }).status, "rejected");
  assert.equal(legal({ field: "rule_status", value: "enacted", match: { method: "m", matched: "", confidence: "normalized" } }).status, "rejected");
  assert.equal(legal({ field: "rule_status", value: "enacted", valid: { from: "2027-01-01", to_exclusive: "2026-01-01" } }).status, "rejected");
  const rule = { team_rule_id: "x", effective_date: "2026-01-01", conflict_flag: false, conflict_note: null,
    logic: { status_kind: "enacted" }, extraction: { review: [] } } as unknown as Rule;
  const out = applyLegalEvidence([rule], [legal({ id: "a", field: "rule_effective_date", value: "2025-06-01" }), legal({ id: "b", field: "rule_effective_date", value: "2027-01-01" })]);
  assert.equal(out.conflicts.length, 1);
  assert.equal(out.rules[0].effective_date, "2026-01-01"); // no winner chosen
  assert.deepEqual(out.rules[0].logic.disputed_effective_dates?.sort(), ["2025-06-01", "2027-01-01"]);
  assert.equal(out.rules[0].conflict_flag, true);
});

test("verified import requires a named reviewer", () => {
  assert.equal(rec({ provenance: "verified_import" }).status, "rejected");
  assert.equal(rec({ provenance: "verified_import", reasons: ["reviewer: R. Dhara"] }).status, "validated");
});

test("official legislative evidence updates a rule's legal version, with provenance", () => {
  const rule = { team_rule_id: "sd", effective_date: null, logic: { status_kind: "pending" }, extraction: { review: [] } } as unknown as Rule;
  const ev = [rec({ subject: { rule_id: "sd", level: "law", key: "SDMC 98.1101" }, field: "rule_status", value: "enacted" }),
    rec({ id: "e2", subject: { rule_id: "sd", level: "law", key: "SDMC 98.1101" }, field: "rule_effective_date", value: "2025-06-21" })];
  const out = applyLegalEvidence([rule], ev).rules[0];
  assert.equal(out.logic.status_kind, "enacted");
  assert.equal(out.effective_date, "2025-06-21");
  assert.ok(out.extraction.review.some((x) => x.includes("example.gov")));
});

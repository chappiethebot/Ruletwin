// Regressions for findings in docs/AUDIT.md. Each test states the required behavior
// independently of the implementation it guards.
import { test } from "node:test";
import assert from "node:assert/strict";
import { evalAtom, evaluateProperty } from "./engine.ts";
import { resolveProperty, applyAnswers } from "./resolve.ts";
import { runChange, matchRules } from "./changes.ts";
import { applyPropertyEvidence, validateRecord, type EvidenceRecord } from "./evidence.ts";
import { factsFromRow } from "./facts.ts";
import type { Atom, Property, Rule, RuleLogic } from "./types.ts";

const atom = (field: Atom["field"], op: Atom["op"], value: string, negate = false): Atom =>
  ({ field, op, value, negate, description: `${field} ${op} ${value}`, quote: "" });
const logic = (o: Partial<RuleLogic> = {}): RuleLogic =>
  ({ status_kind: "enacted", conditions: [], exemptions: [], yields_to_local: false, conflict_with_local: false, ...o });
const rule = (id: string, o: Partial<Rule> = {}): Rule => ({
  team_rule_id: id, jurisdiction: "CA", level: "state", category: "algorithmic_rent_setting", status: "in_force", title: id,
  requirement: "", key_value: null, coverage_conditions: null, exemptions: null, overrides: [], interaction: null, effective_date: null,
  citation: id, source_doc_id: "D", source_url: "u", quoted_span: "x".repeat(20), confidence: 1, conflict_flag: false, conflict_note: null,
  logic: logic(), source: { doc_id: "D", url: "u", retrieved_at: null, source_type: "official", start: 0, end: 1 },
  extraction: { model: "m", prompt_version: "p", chunk_hash: "h", review: [] }, ...o,
});
const prop = (o: Record<string, string> = {}, city: string | null = "Los Angeles", id = "P"): Property => {
  const r = { address_id: id, street_address: "1 A ST", postal_city: "LA", state: "CA", zip: "", year_built: "", units: "20",
    use_code: "", use_description: "", source_dataset: "t", retrieved_at: "2026-10-01T22:50Z", ...o };
  return { ...r, raw: r, city, city_evidence: "t", facts: factsFromRow(r) } as Property;
};

test("C08: a day-precision year-built cutoff leaves the cutoff year unknown", () => {
  const a = atom("year_built", "le", "1978-10-01");
  assert.equal(evalAtom(a, prop({ year_built: "1977" }).facts, "2026-10-01").truth, "true");
  assert.equal(evalAtom(a, prop({ year_built: "1978" }).facts, "2026-10-01").truth, "unknown");
  assert.equal(evalAtom(a, prop({ year_built: "1979" }).facts, "2026-10-01").truth, "false");
});

test("F03: a disputed effective date straddling the query date is not answered definitely", () => {
  const r = rule("d", { effective_date: "2025-01-01", logic: logic({ disputed_effective_dates: ["2027-01-01"] }) });
  const ev = resolveProperty([r], prop(), "2026-01-01").evaluations[0];
  assert.equal(ev.result, "unknown");
  assert.ok(ev.resolution.decisive.some((d) => d.startsWith("dispute:")));
  // Both alternatives before the query date: the dispute is immaterial.
  const both = rule("d", { effective_date: "2025-01-01", logic: logic({ disputed_effective_dates: ["2025-06-01"] }) });
  assert.equal(resolveProperty([both], prop(), "2026-01-01").evaluations[0].result, "applies");
});

test("F06: change tracking counts loss of coverage in a reverse-date comparison", () => {
  const r = rule("ab", { effective_date: "2026-01-01" });
  const t = { test_id: "rev", title: "reverse", type: "as_of", rule_ids: [], as_of_before: "2026-01-02", as_of_after: "2025-12-31" };
  const res = runChange(t, [r], [prop()], ["ab"]);
  assert.equal(res.affected.length, 1);
  assert.deepEqual(res.affected[0].after.map((e) => e.result), ["not_yet_effective"]);
});

test("F28: proposal aliases are matched individually to the bill named in order", () => {
  const s = rule("s", { jurisdiction: "MA", citation: "S.2983 (194th Gen. Ct.)", logic: logic({ status_kind: "pending" }) });
  const h = rule("h", { jurisdiction: "MA", citation: "H.5222 (194th Gen. Ct.)", logic: logic({ status_kind: "pending" }) });
  const title = "Massachusetts pending bills S.2983 and H.5222";
  assert.deepEqual(matchRules("MA-ALG-P1", [s, h], { title, type: "pending" }).rules.map((r) => r.team_rule_id), ["s"]);
  assert.deepEqual(matchRules("MA-ALG-P2", [s, h], { title, type: "pending" }).rules.map((r) => r.team_rule_id), ["h"]);
  const amb = matchRules("MA-ALG-P1", [s, h], { title: "two bills", type: "as_of" });
  assert.equal(amb.rules.length, 2);
  assert.match(amb.note ?? "", /ambiguous/);
});

test("F15: clarification answers must be an offered option; malformed answers are rejected", () => {
  const r = rule("rc", { category: "rent_increase_limits", logic: logic({ conditions: [{ any: [atom("co_date", "le", "1979-06-13")] }] }) });
  const p = prop({ year_built: "" });
  const q = resolveProperty([r], p, "2026-10-01").questions[0];
  assert.ok(applyAnswers([r], p, "2026-10-01", { [q.id]: q.options[0] }));
  assert.equal(applyAnswers([r], p, "2026-10-01", { [q.id]: "1900-01-01 – 1950-01-01" }), null); // not an offered cell
  assert.equal(applyAnswers([r], p, "2026-10-01", { [q.id]: "abc – xyz" }), null);
  assert.equal(applyAnswers([r], p, "2026-10-01", { "fact:nonexistent": "x" }), null);
});

test("F26: sentinel, future and non-digit numeric inputs are rejected but keep raw strings", () => {
  assert.equal(prop({ year_built: "9999" }).facts.year_built?.state, "missing");
  assert.equal(prop({ year_built: "2027" }).facts.year_built?.state, "missing"); // after capture year 2026
  assert.equal(prop({ units: "2e1" }).facts.units?.state, "missing");
  assert.equal(prop({ units: " 12 " }).facts.units?.lo, 12);
  assert.equal(prop({ year_built: "9999" }).raw.year_built, "9999");
});

test("F27: NJ building-description unit shorthand is a disclosed presumption, not an observation", () => {
  const f = prop({ state: "NJ", units: "", use_code: "4C", use_description: "6B-20U-G" }).facts.units!;
  assert.equal(f.state, "presumed");
  assert.equal(prop({ state: "NJ", units: "", use_code: "4C", use_description: "3SB" }).facts.units?.state, "known"); // class 4C -> [5, inf)
});

test("F08: the CO bound is a presumption that is disclosed, and never rejects an observed CO record", () => {
  const r = rule("rso", { category: "rent_increase_limits", logic: logic({ conditions: [{ any: [atom("co_date", "le", "1979-06-13")] }] }) });
  const p = prop({ year_built: "1962" });
  assert.equal(p.facts.co_date?.state, "presumed");
  const ev = evaluateProperty([r], p, "2026-10-01")[0];
  assert.equal(ev.result, "applies");
  assert.ok(ev.presumptions.some((x) => x.startsWith("co_date")));
  // A real CO record far outside the presumed bound still decides (not rejected as inadmissible).
  const co: EvidenceRecord = validateRecord({
    id: "co", subject: { property_id: "P", level: "building", key: "k" }, field: "co_date", value: "1990-05-01", valid: { from: null, to_exclusive: null },
    source: { adapter: "t", url: "https://x.gov", retrieved_at: "2026-10-04T00:00:00Z", span: "CO 1990-05-01", terms: "" },
    match: { method: "m", matched: "1 A ST", confidence: "exact" }, provenance: "automated", status: "validated", reasons: [] });
  const withCo = applyPropertyEvidence(p, [co], "2026-10-01").property;
  const res = resolveProperty([r], withCo, "2026-10-01").evaluations[0];
  assert.equal(res.result, "not_applicable");
  assert.notEqual(res.resolution.method, "review_required");
});

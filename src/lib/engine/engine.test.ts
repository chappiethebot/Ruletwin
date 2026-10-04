// Run: npm test   (node --test, native TypeScript stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { and, or, not, evalAtom, evaluateRule, evaluateProperty, temporalStatus, resolveValue } from "./engine.ts";
import { factsFromRow, unitsFromUse, parseCsv } from "./facts.ts";
import type { Atom, Property, Rule, RuleLogic } from "./types.ts";

const T = "true", F = "false", U = "unknown";

test("strong Kleene truth tables", () => {
  assert.equal(and([F, U]), F);
  assert.equal(and([T, U]), U);
  assert.equal(and([T, T]), T);
  assert.equal(or([T, U]), T);
  assert.equal(or([F, U]), U);
  assert.equal(or([F, F]), F);
  assert.equal(not(U), U);
  assert.equal(not(T), F);
});

const atom = (field: Atom["field"], op: Atom["op"], value: string, negate = false): Atom =>
  ({ field, op, value, negate, description: `${field} ${op} ${value}`, quote: "" });

const row = (o: Record<string, string> = {}) => ({
  address_id: "X1", street_address: "1 MAIN ST", postal_city: "San Francisco", state: "CA", zip: "94110",
  year_built: "1962", units: "20", use_code: "A15", use_description: "Apartment 15 Units or more",
  source_dataset: "test", retrieved_at: "", ...o,
});
const prop = (o: Record<string, string> = {}, city: string | null = "San Francisco"): Property => {
  const r = row(o);
  return { ...r, raw: r, city, city_evidence: "test", facts: factsFromRow(r) } as Property;
};

test("threshold k-1 / k / k+1", () => {
  const a = atom("units", "ge", "5");
  assert.equal(evalAtom(a, prop({ units: "4" }).facts, "2026-10-01").truth, F);
  assert.equal(evalAtom(a, prop({ units: "5" }).facts, "2026-10-01").truth, T);
  assert.equal(evalAtom(a, prop({ units: "6" }).facts, "2026-10-01").truth, T);
});

test("missing fact is unknown, never false; unit ranges decide when they can", () => {
  const a = atom("units", "ge", "5");
  assert.equal(evalAtom(a, prop({ units: "", use_description: "unknown use" }).facts, "2026-10-01").truth, U);
  assert.equal(evalAtom(a, prop({ units: "", use_description: "4-8-UNIT-APT" }).facts, "2026-10-01").truth, U);
  assert.equal(evalAtom(atom("units", "ge", "4"), prop({ units: "", use_description: "4-8-UNIT-APT" }).facts, "2026-10-01").truth, T);
  // null is not zero
  assert.equal(evalAtom(atom("units", "lt", "1"), prop({ units: "" , use_description: "x"}).facts, "2026-10-01").truth, U);
});

test("year built only bounds the CO date: a cutoff inside the build year is unknown", () => {
  const a = atom("co_date", "le", "1979-06-13");
  assert.equal(evalAtom(a, prop({ year_built: "1977" }).facts, "2026-10-01").truth, T);
  assert.equal(evalAtom(a, prop({ year_built: "1978" }).facts, "2026-10-01").truth, T);
  assert.equal(evalAtom(a, prop({ year_built: "1979" }).facts, "2026-10-01").truth, U);
  assert.equal(evalAtom(a, prop({ year_built: "1980" }).facts, "2026-10-01").truth, F);
});

test("numeric membership on intervals", () => {
  const a = atom("units", "in", "2|3");
  assert.equal(evalAtom(a, prop({ units: "", use_description: "x", use_code: "4C", state: "NJ" }).facts, "2026-10-01").truth, F); // 5+
  assert.equal(evalAtom(a, prop({ units: "3" }).facts, "2026-10-01").truth, T);
  assert.equal(evalAtom(a, prop({ units: "", use_description: "4-8-UNIT-APT" }).facts, "2026-10-01").truth, F);
  assert.equal(evalAtom(a, prop({ units: "", use_description: "TIC Bldg 4 units or less" }).facts, "2026-10-01").truth, U);
});

test("rolling cutoff AS_OF-15Y", () => {
  assert.equal(resolveValue("AS_OF-15Y", "2026-10-01"), "2011-10-01");
  const a = atom("co_date", "gt", "AS_OF-15Y"); // exempt if CO within previous 15 years
  assert.equal(evalAtom(a, prop({ year_built: "2015" }).facts, "2026-10-01").truth, T);
  assert.equal(evalAtom(a, prop({ year_built: "2011" }).facts, "2026-10-01").truth, U);
  assert.equal(evalAtom(a, prop({ year_built: "2010" }).facts, "2026-10-01").truth, F);
  assert.equal(evalAtom(a, prop({ year_built: "2009" }).facts, "2026-10-01").truth, F);
});

const logic = (o: Partial<RuleLogic> = {}): RuleLogic =>
  ({ status_kind: "enacted", conditions: [], exemptions: [], yields_to_local: false, conflict_with_local: false, ...o });
const rule = (o: Partial<Rule> = {}): Rule => ({
  team_rule_id: "r1", jurisdiction: "CA", level: "state", category: "security_deposits", status: "in_force",
  title: "t", requirement: "r", key_value: null, coverage_conditions: null, exemptions: null, overrides: [],
  interaction: null, effective_date: null, citation: "c", source_doc_id: "D1", source_url: "u",
  quoted_span: "q".repeat(20), confidence: 0.9, conflict_flag: false, conflict_note: null,
  logic: logic(), source: { doc_id: "D1", url: "u", retrieved_at: null, source_type: "official", start: 0, end: 1 },
  extraction: { model: "m", prompt_version: "p", chunk_hash: "h", review: [] }, ...o,
});

test("effective date D-1 / D / D+1; pending never self-enacts; failed never applies", () => {
  const r = rule({ effective_date: "2026-01-01" });
  assert.equal(temporalStatus(r, "2025-12-31"), "not_yet_effective");
  assert.equal(temporalStatus(r, "2026-01-01"), "in_force");
  assert.equal(temporalStatus(r, "2026-01-02"), "in_force");
  const p = rule({ effective_date: "2020-01-01", logic: logic({ status_kind: "pending" }) });
  assert.equal(evaluateRule(p, prop(), "2030-01-01").result, "pending");
  const f = rule({ logic: logic({ status_kind: "failed" }) });
  assert.equal(evaluateRule(f, prop(), "2026-10-01").result, "not_applicable");
  assert.equal(temporalStatus(rule({ effective_date: "2026-03" }), "2026-03-15"), "date_ambiguous");
});

test("exemption, unknown exemption, counter-exception", () => {
  const smallOwnerOcc = { label: "owner-occupied 2 units or fewer", quote: "", all: [atom("owner_occupied", "eq", "true"), atom("units", "le", "2")] };
  const r = rule({ logic: logic({ exemptions: [smallOwnerOcc] }) });
  // decisive false conjunct beats an unknown one
  assert.equal(evaluateRule(r, prop({ units: "20" }), "2026-10-01").result, "applies");
  assert.equal(evaluateRule(r, prop({ units: "2" }), "2026-10-01").result, "unknown");
  // counter-exception: exempt single-family unless owned by a corporation
  const sfr = { label: "SFR not corporate", quote: "", all: [atom("property_type", "eq", "single_family"), atom("owner_type", "eq", "corporation", true)] };
  assert.equal(evaluateRule(rule({ logic: logic({ exemptions: [sfr] }) }), prop(), "2026-10-01").result, "applies");
});

test("empty condition groups / exemptions never decide coverage", () => {
  const r = rule({ logic: logic({ conditions: [{ any: [] }], exemptions: [{ label: "seasonal", all: [], quote: "" }] }) });
  assert.equal(evaluateRule(r, prop(), "2026-10-01").result, "applies");
});

test("unsupported predicate yields unknown, not a dropped condition", () => {
  const r = rule({ logic: logic({ conditions: [{ any: [atom("other", "eq", "x")] }] }) });
  assert.equal(evaluateRule(r, prop(), "2026-10-01").result, "unknown");
});

test("wrong jurisdiction never applies; unresolved city is unknown", () => {
  const sf = rule({ jurisdiction: "San Francisco, CA", level: "city" });
  assert.equal(evaluateRule(sf, prop({}, "Los Angeles"), "2026-10-01").result, "not_applicable");
  assert.equal(evaluateRule(sf, prop({}, null), "2026-10-01").result, "unknown");
  assert.equal(evaluateRule(sf, prop({ state: "NJ" }, "San Francisco"), "2026-10-01").result, "not_applicable");
  assert.equal(evaluateRule(rule({ jurisdiction: "NJ" }), prop(), "2026-10-01").result, "not_applicable");
});

test("state rule yields only where the local rule applies; conflict flags propagate", () => {
  const state = rule({ team_rule_id: "s", category: "rent_increase_limits", logic: logic({ yields_to_local: true }) });
  const local = rule({ team_rule_id: "l", jurisdiction: "San Francisco, CA", level: "city", category: "rent_increase_limits",
    logic: logic({ conditions: [{ any: [atom("co_date", "le", "1979-06-13")] }] }) });
  const r1962 = evaluateProperty([state, local], prop({ year_built: "1962" }), "2026-10-01");
  assert.deepEqual(r1962.map((e) => e.result), ["superseded", "applies"]);
  const r1990 = evaluateProperty([state, local], prop({ year_built: "1990" }), "2026-10-01");
  assert.deepEqual(r1990.map((e) => e.result), ["applies", "not_applicable"]);
  const r1979 = evaluateProperty([state, local], prop({ year_built: "1979" }), "2026-10-01");
  assert.deepEqual(r1979.map((e) => e.result), ["unknown", "unknown"]);

  const fair = rule({ team_rule_id: "nj", jurisdiction: "NJ", category: "algorithmic_rent_setting", effective_date: "2027-07-01",
    logic: logic({ conflict_with_local: true }) });
  const hob = rule({ team_rule_id: "h", jurisdiction: "Hoboken, NJ", level: "city", category: "algorithmic_rent_setting" });
  const evs = evaluateProperty([fair, hob], prop({ state: "NJ" }, "Hoboken"), "2026-10-01");
  assert.deepEqual(evs.map((e) => [e.result, e.conflict_flag]), [["not_yet_effective", true], ["applies", true]]);
  const newark = evaluateProperty([fair, hob], prop({ state: "NJ" }, "Newark"), "2027-07-02");
  assert.deepEqual(newark.map((e) => [e.result, e.conflict_flag]), [["applies", false], ["not_applicable", false]]);
});

test("untestable exemption is a disclosed presumption; city rule can yield to sibling city rule", () => {
  const share = { label: "tenant shares kitchen with owner", quote: "", all: [atom("other", "eq", "shared_kitchen")], presumed_inapplicable: true };
  const ev = evaluateRule(rule({ logic: logic({ exemptions: [share] }) }), prop(), "2026-10-01");
  assert.equal(ev.result, "applies");
  assert.ok(ev.presumptions.some((x) => x.includes("shares kitchen")));
  const jco = rule({ team_rule_id: "jco", jurisdiction: "San Francisco, CA", level: "city", category: "just_cause_eviction", logic: logic({ yields_to_local: true }) });
  const rso = rule({ team_rule_id: "rso", jurisdiction: "San Francisco, CA", level: "city", category: "just_cause_eviction",
    logic: logic({ conditions: [{ any: [atom("co_date", "le", "1978-10-01")] }] }) });
  assert.deepEqual(evaluateProperty([jco, rso], prop({ year_built: "1960" }), "2026-10-01").map((e) => e.result), ["superseded", "applies"]);
  assert.deepEqual(evaluateProperty([jco, rso], prop({ year_built: "1990" }), "2026-10-01").map((e) => e.result), ["applies", "not_applicable"]);
});

test("same inputs give identical output", () => {
  const r = rule({ logic: logic({ conditions: [{ any: [atom("units", "ge", "3")] }] }) });
  assert.equal(JSON.stringify(evaluateRule(r, prop(), "2026-10-01")), JSON.stringify(evaluateRule(r, prop(), "2026-10-01")));
});

test("use-code unit parsing and CSV", () => {
  assert.deepEqual(unitsFromUse("111", "4-8-UNIT-APT", "MA")?.slice(0, 2), [4, 8]);
  assert.deepEqual(unitsFromUse("112", ">8-UNIT-APT", "MA")?.slice(0, 2), [9, Infinity]);
  assert.deepEqual(unitsFromUse("4C", "3S-F-D-6U-NH", "NJ")?.slice(0, 2), [6, 6]);
  assert.deepEqual(unitsFromUse("4C", "3SB", "NJ")?.slice(0, 2), [5, Infinity]);
  assert.equal(unitsFromUse("A/125", "SUBSD HOUSING S- 8", "MA"), null);
  assert.deepEqual(parseCsv('a,b\n1,"x, ""y"""\n'), [{ a: "1", b: 'x, "y"' }]);
});

test("an effective date stated only by a research capture flags each answer for review, not the preemption path", () => {
  const note = "Effective date 2026-01 is stated only in research capture S037, not in the supplied text (D001).";
  const [ev] = evaluateProperty([rule({ level: "city", jurisdiction: "San Francisco, CA", effective_date: "2026-01", logic: logic({ unverified_effective_date: note }) })], prop(), "2026-10-01");
  assert.equal(ev.result, "applies");
  assert.equal(ev.conflict_flag, true);
  assert.deepEqual(ev.conflict_with, []);
  assert.ok(ev.explanation.includes(note) && !ev.explanation.includes("preemption"));
  const [plain] = evaluateProperty([rule()], prop(), "2026-10-01");
  assert.equal(plain.conflict_flag, false);
});

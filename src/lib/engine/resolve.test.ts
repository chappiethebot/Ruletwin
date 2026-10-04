import { test } from "node:test";
import assert from "node:assert/strict";
import { partition, resolveProperty } from "./resolve.ts";
import { factsFromRow } from "./facts.ts";
import type { Atom, Property, Rule, RuleLogic } from "./types.ts";

const atom = (field: Atom["field"], op: Atom["op"], value: string, negate = false, description = `${field} ${op} ${value}`): Atom =>
  ({ field, op, value, negate, description, quote: "" });
const logic = (o: Partial<RuleLogic> = {}): RuleLogic =>
  ({ status_kind: "enacted", conditions: [], exemptions: [], yields_to_local: false, conflict_with_local: false, ...o });
const rule = (id: string, o: Partial<Rule> = {}): Rule => ({
  team_rule_id: id, jurisdiction: "CA", level: "state", category: "rent_increase_limits", status: "in_force", title: id,
  requirement: "", key_value: null, coverage_conditions: null, exemptions: null, overrides: [], interaction: null, effective_date: null,
  citation: id, source_doc_id: "D", source_url: "u", quoted_span: "x".repeat(20), confidence: 1, conflict_flag: false, conflict_note: null,
  logic: logic(), source: { doc_id: "D", url: "u", retrieved_at: null, source_type: "official", start: 0, end: 1 },
  extraction: { model: "m", prompt_version: "p", chunk_hash: "h", review: [] }, ...o,
});
const prop = (o: Record<string, string> = {}, city: string | null = "San Francisco", cands?: string[]): Property => {
  const r = { address_id: "X", street_address: "1 A ST", postal_city: "SF", state: "CA", zip: "", year_built: "", units: "20",
    use_code: "", use_description: "", source_dataset: "t", ...o };
  return { ...r, raw: r, city, city_evidence: "t", facts: factsFromRow(r), ...(cands ? { city_candidates: cands } : {}) } as Property;
};

test("partition splits at thresholds into decisive cells", () => {
  assert.deepEqual(partition(1, Infinity, [5, 2]).map((c) => [c.lo, c.hi]), [[1, 1], [2, 2], [3, 4], [5, 5], [6, Infinity]]);
  assert.deepEqual(partition("1970-01-01", "1990-12-31", ["1979-06-13"]).map((c) => [c.lo, c.hi]),
    [["1970-01-01", "1979-06-12"], ["1979-06-13", "1979-06-13"], ["1979-06-14", "1990-12-31"]]);
});

test("missing fact proven irrelevant when every admissible value gives the same result", () => {
  const r = rule("taut", { logic: logic({ conditions: [{ any: [atom("year_built", "le", "1979"), atom("year_built", "gt", "1979")] }] }) });
  const ev = resolveProperty([r], prop(), "2026-10-01").evaluations[0];
  assert.equal(ev.result, "applies");
  assert.equal(ev.resolution.method, "constraints");
  assert.ok(ev.resolution.irrelevant.some((x) => x.fact === "year built"));
});

test("shared predicate is one variable across rules (dependency preserved)", () => {
  const x = atom("other", "eq", "shared_x");
  const a = rule("A", { logic: logic({ conditions: [{ any: [x] }] }) });
  const b = rule("B", { logic: logic({ exemptions: [{ label: "x", all: [x], quote: "" }] }) });
  const res = resolveProperty([a, b], prop(), "2026-10-01");
  assert.deepEqual(res.evaluations.map((e) => e.resolution.method), ["conditional", "conditional"]);
  assert.deepEqual(res.evaluations[0].resolution.branches.map((br) => br.result).sort(), ["applies", "not_applicable"]);
  assert.equal(res.evaluations[0].resolution.completions, 2); // one shared variable, not two
  assert.deepEqual(res.questions.map((q) => q.id), ["other:shared_x"]);
});

test("conditional branches preserve the complete joint truth table", () => {
  const x = atom("other", "eq", "x", false, "X");
  const y = atom("other", "eq", "y", false, "Y");
  for (const kind of ["xor", "or", "and"] as const) {
    const conditions = kind === "xor"
      ? [{ any: [x, y] }, { any: [{ ...x, negate: true }, { ...y, negate: true }] }]
      : kind === "or" ? [{ any: [x, y] }] : [{ any: [x] }, { any: [y] }];
    const r = rule(kind, { logic: logic({ conditions }) });
    const res = resolveProperty([r], prop(), "2026-10-01").evaluations[0].resolution;
    assert.equal(res.result, "unknown");
    assert.equal(res.completions, 4);
    for (const xv of [false, true]) for (const yv of [false, true]) {
      const values = { X: xv ? "yes" : "no", Y: yv ? "yes" : "no" };
      const expected = (kind === "xor" ? xv !== yv : kind === "or" ? xv || yv : xv && yv) ? "applies" : "not_applicable";
      // Independent matching of the displayed DNF, with no production evaluator.
      const matching = res.branches.filter((b) => b.when.some((group) => group.every((condition) => {
        const [label, options] = condition.split(": ");
        return options.split(" or ").includes(values[label as keyof typeof values]);
      })));
      assert.deepEqual(matching.map((b) => b.result), [expected], `${kind}: X=${xv}, Y=${yv}`);
    }
  }
});

test("zero admissible completions require review and establish no coverage", () => {
  const p = prop({ units: "3" });
  p.facts.property_type = { state: "known", cat: "duplex", source: "fixture" };
  const r = rule("inconsistent", { logic: logic({ conditions: [{ any: [atom("other", "eq", "x")] }] }) });
  const res = resolveProperty([r], p, "2026-10-01").evaluations[0].resolution;
  assert.equal(res.result, "unknown");
  assert.equal(res.method, "review_required");
  assert.equal(res.completions, 0);
  assert.equal(res.exhaustive, false);
  assert.deepEqual(res.established, []);
  assert.deepEqual(res.irrelevant, []);
  assert.deepEqual(res.branches, []);
  assert.ok(res.next_action?.includes("Review"));
});

test("correlated domains can make a question useful without a one-coordinate flip", () => {
  const p = prop();
  p.facts.units = { state: "known", lo: 1, hi: 3, source: "fixture" };
  p.facts.property_type = { state: "missing", source: "fixture" };
  const r = rule("single-family", { logic: logic({ conditions: [
    { any: [atom("property_type", "eq", "single_family")] },
    { any: [atom("units", "le", "2"), atom("units", "gt", "2")] },
  ] }) });
  const res = resolveProperty([r], p, "2026-10-01");
  assert.equal(res.evaluations[0].result, "unknown");
  assert.ok(res.questions.some((q) => q.id === "fact:units"));
  assert.ok(!res.evaluations[0].resolution.irrelevant.some((f) => f.fact === "number of units"));
});

test("CO date bounded by year built; covered either way near the cutoff", () => {
  const local = rule("sf", { jurisdiction: "San Francisco, CA", level: "city",
    logic: logic({ exemptions: [{ label: "new", quote: "", all: [atom("co_date", "gt", "1979-06-13")] }] }) });
  const state = rule("ab", { logic: logic({ yields_to_local: true }) });
  const st = resolveProperty([state, local], prop({ year_built: "1979" }), "2026-10-01").evaluations[0].resolution;
  assert.equal(st.method, "conditional");
  assert.ok(st.established.some((s) => s.includes("covered")));
  assert.deepEqual(st.branches.map((b) => b.result).sort(), ["applies", "superseded"]);
  assert.ok(st.branches.find((b) => b.result === "superseded")!.when[0].some((s) => s.includes("≤ 1979-06-13")));
  const r1990 = resolveProperty([state, local], prop({ year_built: "1990" }), "2026-10-01").evaluations[0];
  assert.equal(r1990.result, "applies");
  assert.equal(r1990.resolution.method, "data");
});

test("ambiguous city: only conclusions shared by all candidates", () => {
  const ban = (c: string) => rule(c, { jurisdiction: `${c}, CA`, level: "city", category: "algorithmic_rent_setting" });
  const rules = [ban("Los Angeles"), ban("Berkeley"), rule("state", { category: "algorithmic_rent_setting" })];
  const one = resolveProperty(rules, prop({}, null, ["Los Angeles"]), "2026-10-01");
  assert.equal(one.evaluations[0].result, "applies");
  assert.equal(one.evaluations[1].result, "not_applicable");
  const two = resolveProperty(rules, prop({}, null, ["Los Angeles", "Berkeley"]), "2026-10-01");
  assert.equal(two.evaluations[0].resolution.method, "conditional");
  assert.equal(two.evaluations[2].result, "applies"); // state rule is shared by every candidate
  assert.equal(two.questions[0].id, "city");
});

test("enumeration limit is reported, never a proof", () => {
  const atoms = Array.from({ length: 14 }, (_, i) => atom("other", "eq", `q${i}`));
  const r = rule("big", { logic: logic({ conditions: [{ any: atoms }] }) });
  const res = resolveProperty([r], prop(), "2026-10-01", { limit: 1000 });
  assert.equal(res.evaluations[0].resolution.method, "limit_reached");
  assert.equal(res.evaluations[0].resolution.exhaustive, false);
  assert.equal(res.evaluations[0].result, "unknown");
  assert.equal(res.limit_reached, true);
});

test("disputed effective date branches only when it straddles the as-of date", () => {
  const local = rule("loc", { jurisdiction: "San Francisco, CA", level: "city", effective_date: "2026-01", category: "algorithmic_rent_setting",
    logic: logic({ disputed_effective_dates: ["2026-03-01"] }) });
  assert.equal(resolveProperty([local], prop(), "2026-10-01").evaluations[0].result, "applies");
  const mid = resolveProperty([local], prop(), "2026-01-15").evaluations[0]; // inside "2026-01": missing legal version
  assert.equal(mid.resolution.method, "conditional");
  assert.ok(mid.resolution.decisive.some((d) => d.startsWith("legal:") || d.startsWith("dispute:")));
});

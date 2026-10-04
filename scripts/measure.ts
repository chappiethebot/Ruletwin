// Measures the evidence-resolution layer against data/reference/reference.json and
// across all 500 properties. Writes data/reference/results.json + docs/EVALUATION.md.
// Usage: node scripts/measure.ts   (run scripts/enrich.ts first)
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { evaluateProperty, type Assumptions } from "../src/lib/engine/engine.ts";
import { resolveProperty, applyAnswers } from "../src/lib/engine/resolve.ts";
import { applyLegalEvidence, applyPropertyEvidence, type EvidenceRecord } from "../src/lib/engine/evidence.ts";
import type { Property, Result, Rule } from "../src/lib/engine/types.ts";
import { consolidate, loadProperties } from "./publish.ts";
import { DATA_DIR, ROOT, readJson, writeJson } from "./config.ts";

interface Case { id: string; address_id: string; as_of: string; rule: { jurisdiction: string; category: string; citation_re?: string }; expected: Result | "indeterminate"; types: string[]; basis: string }
type Config = "previous_release" | "baseline_kleene" | "constraints" | "enrichment";

const ref = readJson<{ cases: Case[]; reviewed_by: string }>(path.join(DATA_DIR, "reference", "reference.json"));
const rules0: Rule[] = consolidate(readJson(path.join(DATA_DIR, "extraction", "candidates.json")));
const evidence: EvidenceRecord[] = readJson(path.join(DATA_DIR, "evidence", "records.json"));
const rulesEv = applyLegalEvidence(rules0, evidence).rules;
const props = loadProperties();
const byId = new Map(props.map((p) => [p.address_id, p]));

// Previous release (commit 17631bd): its official lookups for 2026-10-01.
let previous: Record<string, { team_rule_id: string; result: Result }[]> | null = null;
try { previous = JSON.parse(execSync("git show 17631bd:submission/lookups.json", { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 })).lookups; } catch { previous = null; }
const prevRules: Rule[] | null = (() => { try { return JSON.parse(execSync("git show 17631bd:submission/rules.json", { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 })).rules; } catch { return null; } })();

const matches = (r: Pick<Rule, "jurisdiction" | "category" | "citation" | "title">, c: Case) =>
  r.jurisdiction === c.rule.jurisdiction && r.category === c.rule.category && (!c.rule.citation_re || new RegExp(c.rule.citation_re, "i").test(`${r.citation} ${r.title}`));

function answer(cfg: Config, c: Case): string[] | null {
  const p = byId.get(c.address_id)!;
  if (cfg === "previous_release") {
    if (!previous || !prevRules || c.as_of !== "2026-10-01") return null;
    const ids = prevRules.filter((r) => matches(r as Rule, c)).map((r) => r.team_rule_id);
    if (!ids.length) return ["no_rule"];
    const got = previous[c.address_id] ?? [];
    return [...new Set(ids.map((i) => got.find((x) => x.team_rule_id === i)?.result ?? "not_applicable"))];
  }
  const rules = cfg === "enrichment" ? rulesEv : rules0;
  const ids = new Set(rules.filter((r) => matches(r, c)).map((r) => r.team_rule_id));
  if (!ids.size) return ["no_rule"];
  const prop = cfg === "enrichment" ? applyPropertyEvidence(p, evidence, c.as_of).property : p;
  const evs = cfg === "baseline_kleene" ? evaluateProperty(rules, prop, c.as_of) : resolveProperty(rules, prop, c.as_of).evaluations;
  return [...new Set(evs.filter((e) => ids.has(e.rule_id)).map((e) => e.result))];
}

function score(cfg: Config) {
  const rows = ref.cases.map((c) => {
    const got = answer(cfg, c);
    if (!got) return { id: c.id, types: c.types, expected: c.expected, got: null, verdict: "not_evaluable" };
    const definite = got.length === 1 && got[0] !== "unknown" && got[0] !== "no_rule";
    const verdict = got[0] === "no_rule" ? "no_matching_rule"
      : got.length > 1 && got.filter((g) => g !== "unknown").length > 1 ? "conflicting_outputs"
      : !definite ? (c.expected === "indeterminate" ? "correctly_indeterminate" : "unresolved")
      : c.expected === "indeterminate" ? "overclaim"
      : got[0] === c.expected ? "correct" : "wrong";
    return { id: c.id, types: c.types, expected: c.expected, got, verdict };
  });
  const ev = rows.filter((r) => r.verdict !== "not_evaluable");
  const definiteAnswers = ev.filter((r) => ["correct", "wrong", "overclaim"].includes(r.verdict));
  const definiteExpected = ev.filter((r) => r.expected !== "indeterminate");
  const n = (v: string) => ev.filter((r) => r.verdict === v).length;
  return {
    rows,
    summary: {
      evaluated: ev.length,
      definite_answers: definiteAnswers.length,
      definitive_answer_accuracy: definiteAnswers.length ? +(n("correct") / definiteAnswers.length).toFixed(3) : null,
      resolution_coverage: definiteExpected.length ? +(n("correct") / definiteExpected.length).toFixed(3) : null,
      correct: n("correct"), wrong: n("wrong"), overclaim: n("overclaim"), conflicting_outputs: n("conflicting_outputs"),
      unresolved: n("unresolved"), correctly_indeterminate: n("correctly_indeterminate"), no_matching_rule: n("no_matching_rule"),
    },
  };
}

// Population-level unknowns and clarification burden on 2026-10-01.
function population(cfg: Exclude<Config, "previous_release">) {
  let unknown = 0, propsWithUnknown = 0, questions = 0, propsWithQuestions = 0;
  for (const p0 of props) {
    const rules = cfg === "enrichment" ? rulesEv : rules0;
    const p = cfg === "enrichment" ? applyPropertyEvidence(p0, evidence, "2026-10-01").property : p0;
    if (cfg === "baseline_kleene") {
      const u = evaluateProperty(rules, p, "2026-10-01").filter((e) => e.result === "unknown").length;
      unknown += u; propsWithUnknown += u ? 1 : 0; continue;
    }
    const r = resolveProperty(rules, p, "2026-10-01");
    const u = r.evaluations.filter((e) => e.result === "unknown").length;
    unknown += u; propsWithUnknown += u ? 1 : 0;
    questions += r.questions.length; propsWithQuestions += r.questions.length ? 1 : 0;
  }
  return { unknown_rule_results: unknown, properties_with_unknown: propsWithUnknown,
    ...(cfg === "baseline_kleene" ? {} : { decisive_questions_total: questions, mean_questions_per_open_property: propsWithQuestions ? +(questions / propsWithQuestions).toFixed(2) : 0 }) };
}

// Masking experiment for the clarification step: hide known year built (and the CO
// bound derived from it), let the system ask, answer from the hidden truth, compare.
function masking() {
  const pool = props.filter((p) => p.state === "CA" && p.facts.year_built?.state === "known" && p.city);
  let asked = 0, resolvedProps = 0, agree = 0, compared = 0, stuck = 0;
  const perProp: number[] = [];
  for (const truth0 of pool) {
    const truth = applyPropertyEvidence(truth0, evidence, "2026-10-01").property;
    const full = new Map(resolveProperty(rulesEv, truth, "2026-10-01").evaluations.map((e) => [e.rule_id, e.result]));
    const masked: Property = { ...truth, facts: { ...truth.facts, year_built: { state: "missing", source: "masked" }, co_date: { state: "missing", source: "masked" } } };
    let p = masked;
    let assume: Assumptions | undefined;
    const answers: Record<string, string> = {};
    let r = resolveProperty(rulesEv, p, "2026-10-01");
    let n = 0;
    for (let guard = 0; guard < 6 && r.questions.length; guard++) {
      const q = r.questions.find((x) => x.id === "fact:year_built" || x.id === "fact:co_date");
      if (!q) break; // remaining questions are about facts the mask did not hide
      const f = truth.facts[q.id.slice(5) as "year_built" | "co_date"]!;
      // Oracle answers with the option that contains the true (possibly interval) value.
      const opt = q.options.find((o) => {
        const m = /^=\s*(\S+)$/.exec(o) ?? /^(\S+)\s+–\s+(\S+)$/.exec(o);
        if (!m) return false;
        const cv = (x: string) => (x === "∞" ? Infinity : /^\d{4}-/.test(x) ? x : Number(x));
        return f.lo! >= cv(m[1]) && f.hi! <= cv(m[2] ?? m[1]);
      });
      if (!opt) { stuck++; break; } // the truth itself is an interval straddling a threshold
      answers[q.id] = opt; n++;
      const a = applyAnswers(rulesEv, masked, "2026-10-01", answers);
      if (!a) break;
      p = a.prop; assume = a.assume;
      r = resolveProperty(rulesEv, p, "2026-10-01", { assume });
    }
    asked += n; perProp.push(n);
    if (!r.questions.some((x) => x.id === "fact:year_built" || x.id === "fact:co_date")) resolvedProps++;
    for (const e of r.evaluations) { if (e.result === "unknown") continue; compared++; if (full.get(e.rule_id) === e.result) agree++; }
  }
  perProp.sort((a, b) => a - b);
  return { properties: pool.length, questions_asked: asked, mean_questions: +(asked / pool.length).toFixed(2),
    max_questions: perProp.at(-1) ?? 0, properties_fully_resolved_on_masked_facts: resolvedProps, oracle_could_not_answer: stuck,
    definite_results_compared: compared, agreement_with_full_data: compared ? +(agree / compared).toFixed(4) : null };
}

function evidenceQuality() {
  const by: Record<string, number> = {};
  for (const r of evidence) by[r.status] = (by[r.status] ?? 0) + 1;
  const validated = evidence.filter((r) => r.status === "validated");
  const complete = validated.filter((r) => r.source.span && /^https?:/.test(r.source.url) && r.source.retrieved_at).length;
  return { records: evidence.length, by_status: by, validated_with_span_url_time: `${complete}/${validated.length}`,
    by_adapter: Object.fromEntries([...new Set(evidence.map((r) => r.source.adapter))].map((a) => [a, Object.fromEntries(
      ["validated", "inconclusive", "rejected"].map((s) => [s, evidence.filter((r) => r.source.adapter === a && r.status === s).length]))])) };
}

const configs: Config[] = ["previous_release", "baseline_kleene", "constraints", "enrichment"];
const scored = Object.fromEntries(configs.map((c) => [c, score(c)]));
const pop = { baseline_kleene: population("baseline_kleene"), constraints: population("constraints"), enrichment: population("enrichment") };
const mask = masking();
const quality = evidenceQuality();
const latency = fs.existsSync(path.join(DATA_DIR, "evidence", "latency.json")) ? readJson(path.join(DATA_DIR, "evidence", "latency.json")) : {};
writeJson(path.join(DATA_DIR, "reference", "results.json"), { generated_at: new Date().toISOString(), reviewed_by: ref.reviewed_by, scored, population: pop, masking: mask, evidence_quality: quality, latency });

// Markdown report.
const t = (rows: string[][]) => rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
const S = (c: Config) => scored[c].summary;
const md = `# Evidence-resolution evaluation

Generated ${new Date().toISOString().slice(0, 16)}Z by \`node scripts/measure.ts\`. Default as-of 2026-10-01 unless a case says otherwise.

**Reference set:** ${ref.cases.length} cases in \`data/reference/reference.json\`, ${ref.reviewed_by}
Small, hand-picked and not independent. Use it to compare configurations, not as an accuracy claim. Passing tests and these numbers do not mean 100% legal accuracy.

## Reference set by configuration

${t([["Config", "Evaluated", "Definite answers", "Definitive-answer accuracy", "Resolution coverage", "Correct", "Wrong", "Overclaim", "Conflicting outputs", "Unresolved", "Correctly indeterminate", "No matching rule"], ["---", ...Array(11).fill("---:")],
  ...configs.map((c) => [c, ...["evaluated", "definite_answers", "definitive_answer_accuracy", "resolution_coverage", "correct", "wrong", "overclaim", "conflicting_outputs", "unresolved", "correctly_indeterminate", "no_matching_rule"].map((k) => String((S(c) as Record<string, unknown>)[k] ?? "–"))])])}

- *Definitive-answer accuracy* = correct ÷ definite answers given (overclaims and wrong answers count against it).
- *Resolution coverage* = correct ÷ cases whose reviewed outcome is definite.
- \`previous_release\` = the official lookups of commit 17631bd. Only 2026-10-01 cases can be evaluated from it.
- \`baseline_kleene\` already includes this task's engine fixes (numeric \`in\`, CO-date bound, geocode house-number validation). It is not the previous release.

## Per-case results (enrichment)

${t([["Case", "Types", "Expected", "Got", "Verdict"], ["---", "---", "---", "---", "---"], ...scored.enrichment.rows.map((r) => [r.id, r.types.join(", "), r.expected, (r.got ?? ["–"]).join(" / "), r.verdict])])}

## All 500 properties (2026-10-01)

${t([["Config", "Unknown rule results", "Properties with ≥1 unknown", "Decisive questions (total)", "Mean questions per open property"], ["---", "---:", "---:", "---:", "---:"],
  ...Object.entries(pop).map(([k, v]) => [k, String(v.unknown_rule_results), String(v.properties_with_unknown), String((v as Record<string, unknown>).decisive_questions_total ?? "–"), String((v as Record<string, unknown>).mean_questions_per_open_property ?? "–")])])}

## Clarification (masking experiment)

For ${mask.properties} CA properties with a known year built, the year and CO bound were hidden. The system asked its decisive questions, and an oracle answered from the hidden values.

- Questions asked: ${mask.questions_asked} (mean ${mask.mean_questions}, max ${mask.max_questions} per property).
- Properties fully resolved on the masked facts: ${mask.properties_fully_resolved_on_masked_facts}/${mask.properties}.
- Oracle could not answer: ${mask.oracle_could_not_answer}. The true value is itself an interval straddling a threshold, so the system rightly stays conditional.
- Agreement of definite results with the full-data run: ${mask.agreement_with_full_data} over ${mask.definite_results_compared} rule results.

## Evidence quality

- ${quality.records} records: ${JSON.stringify(quality.by_status)}. Validated records with span + URL + retrieval time: ${quality.validated_with_span_url_time}.
- By adapter: ${Object.entries(quality.by_adapter).map(([a, v]) => `${a} ${JSON.stringify(v)}`).join("; ")}.

## Retrieval latency (first fetch; cached afterwards)

${t([["Adapter", "Calls", "Median ms", "p95 ms", "Measured"], ["---", "---:", "---:", "---:", "---:"], ...Object.entries(latency as Record<string, { calls: number; median_ms: number | null; p95_ms: number | null; measured: number }>).map(([k, v]) => [k, String(v.calls), String(v.median_ms ?? "–"), String(v.p95_ms ?? "–"), String(v.measured)])])}
`;
fs.writeFileSync(path.join(ROOT, "docs", "EVALUATION.md"), md);
console.log(JSON.stringify({ reference: Object.fromEntries(configs.map((c) => [c, S(c)])), population: pop, masking: mask }, null, 1));

// Constraint-aware resolution on top of the strong-Kleene evaluator.
//
// Kleene evaluation is sound but local: it cannot see that every admissible value
// of a missing fact leads to the same answer, nor which gap actually matters.
// Here we enumerate admissible completions of the *relevant* unknowns:
//   - numeric/date domains are partitioned at every rule threshold, so each cell
//     decides every atom on that field;
//   - one variable per fact / per shared untestable predicate / per legal version,
//     so dependencies are preserved (e.g. the same CO date feeds the state and the
//     local rule; CO date is bounded by year built);
//   - enumeration is bounded; when the bound is hit we say so and keep Kleene's
//     answer — no proof is claimed.
// Strong Kleene is monotone, so results it already determined cannot change; we
// only enumerate for its unknowns.
import { dateInterval, evaluateProperty, otherKey, resolveValue, temporalStatus, type Assumptions } from "./engine.ts";
import { CO_LAG_YEARS } from "./facts.ts";
import type { Atom, AtomTrace, Evaluation, Facts, Field, Property, Result, Rule } from "./types.ts";

export type GapKind = "missing_property_data" | "uncertain_property_identity" | "missing_legal_version" | "disputed_legal_interpretation";

export interface BlockingFact {
  id: string;
  kind: GapKind;
  label: string;
  question: string;
  options: string[];
  decisive_for: string[]; // rule ids whose result changes with this fact
  irrelevant_for: string[]; // rule ids where it was missing but proven irrelevant
  evidence_hint: string | null;
}

// Disjunction of conjunctions: any inner group identifies this outcome, within
// the checked admissible domain. Keep joint relationships when compressing.
export interface Branch { result: Result; completions: number; when: string[][] }

export interface Resolution {
  method: "data" | "constraints" | "conditional" | "limit_reached" | "review_required";
  result: Result; // determined result, or "unknown"
  completions: number; // admissible completions examined
  exhaustive: boolean;
  variables: string[];
  proof: string;
  branches: Branch[];
  decisive: string[];
  irrelevant: { fact: string; proof: string }[];
  established: string[]; // statements true in every admissible completion
  next_action: string | null;
  confidence?: "high" | "medium" | "low"; // derived from the evidence path, not a model score
  confidence_reasons?: string[];
}

export interface PropertyResolution {
  evaluations: (Evaluation & { resolution: Resolution })[];
  blocking: BlockingFact[];
  questions: BlockingFact[]; // decisive gaps, most impactful first
  limit_reached: boolean;
}

interface Cell { label: string; lo?: number | string; hi?: number | string; value?: string | boolean | null }
interface Variable { id: string; kind: GapKind; label: string; field?: Field; cells: Cell[]; ordered: boolean }

const ORDERED: Field[] = ["year_built", "units", "co_date", "owner_portfolio_units"];
const LABEL: Partial<Record<Field, string>> = {
  year_built: "year built", units: "number of units", co_date: "first certificate-of-occupancy date",
  owner_type: "owner type", owner_occupied: "whether the owner lives in the building",
  owner_portfolio_units: "units owned by the owner", property_type: "property type", affordable_restricted: "deed-restricted / subsidized status",
};
const QUESTION: Partial<Record<Field, string>> = {
  co_date: "When was the building's first certificate of occupancy issued?",
  year_built: "What year was the building built?",
  units: "How many units does the building have?",
  owner_type: "Who owns the building (individual, corporation/LLC, REIT, nonprofit, government)?",
  owner_occupied: "Does the owner live in one of the units?",
  owner_portfolio_units: "How many rental units does the owner own in total?",
};
const HINT: Partial<Record<Field, string>> = {
  co_date: "City building-department certificate-of-occupancy record (LA: LADBS open data; or a verified record import)",
  year_built: "County assessor record",
  units: "Assessor parcel record (MassGIS for MA, MOD-IV for NJ)",
  owner_type: "Owner or property manager (owner names are excluded from this dataset)",
  owner_occupied: "Owner or tenant",
};

export const MAX_COMPLETIONS = 4096;

const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const step = (v: number | string, n: number) => (typeof v === "number" ? v + n : addDays(v, n));
const fmt = (v: number | string) => (v === Infinity ? "∞" : String(v));

function domain(field: Field, p: Property, asOf: string): [number | string, number | string] {
  const f = p.facts[field];
  if (f && f.state !== "missing" && f.lo !== undefined && f.hi !== undefined) return [f.lo, f.hi];
  switch (field) {
    case "year_built": return [1700, Number(asOf.slice(0, 4))];
    case "units": return [p.facts.property_type?.cat === "multifamily" ? 2 : 1, Infinity];
    case "co_date": return ["1700-01-01", "2100-12-31"];
    default: return [1, Infinity];
  }
}

// Partition [lo, hi] at thresholds so every comparison on the field is decided per cell.
export function partition(lo: number | string, hi: number | string, thresholds: (number | string)[]): Cell[] {
  const ts = [...new Set(thresholds)].filter((t) => t >= lo && t <= hi).sort((a, b) => (a < b ? -1 : 1));
  const cells: Cell[] = [];
  let cur = lo;
  for (const t of ts) {
    if (cur < t) cells.push({ lo: cur, hi: step(t, -1), label: "" });
    cells.push({ lo: t, hi: t, label: "" });
    cur = step(t, 1);
  }
  if (cur <= hi) cells.push({ lo: cur, hi, label: "" });
  for (const c of cells) c.label = c.lo === c.hi ? `= ${fmt(c.lo!)}` : `${fmt(c.lo!)} – ${fmt(c.hi!)}`;
  return cells;
}

function thresholdsFor(field: Field, rules: Rule[], asOf: string): (number | string)[] {
  const out: (number | string)[] = [];
  for (const r of rules) for (const a of [...r.logic.conditions.flatMap((g) => g.any), ...r.logic.exemptions.flatMap((e) => e.all)]) {
    if (a.field !== field) continue;
    for (const raw of resolveValue(a.value, asOf).split("|")) {
      const v = field === "co_date" ? raw.trim() : Number(raw);
      if (typeof v === "number" ? Number.isFinite(v) : /^\d{4}-\d{2}-\d{2}$/.test(v)) out.push(v);
    }
  }
  return out;
}

// Only atoms inside still-undecided groups can change a result: an unknown atom in a
// condition group already true, or an exemption already false, is irrelevant (Kleene
// monotonicity), so it is not enumerated.
function unknownAtoms(ev: Evaluation): AtomTrace[] {
  return [...ev.conditions.filter((c) => c.truth === "unknown").flatMap((c) => c.atoms),
    ...ev.exemptions.filter((e) => !e.presumed && e.truth === "unknown").flatMap((e) => e.atoms)]
    .filter((a) => a.truth === "unknown");
}

function buildVariables(unknown: Evaluation[], catRules: Rule[], byId: Map<string, Rule>, p: Property, asOf: string, cities: string[]): Variable[] {
  const vars = new Map<string, Variable>();
  const add = (v: Variable) => { if (!vars.has(v.id)) vars.set(v.id, v); };
  for (const ev of unknown) {
    const rule = byId.get(ev.rule_id)!;
    if (ev.jurisdiction === "unknown") {
      const cands = p.city_candidates?.length ? p.city_candidates : [...cities, "another municipality"];
      add({ id: "city", kind: "uncertain_property_identity", label: "legal municipality", ordered: false,
        cells: cands.map((c) => ({ label: c, value: c })) });
    }
    if (ev.temporal === "date_ambiguous") {
      add({ id: `legal:${rule.team_rule_id}`, kind: "missing_legal_version", label: `exact effective date of ${rule.citation} (${rule.effective_date})`,
        ordered: false, cells: [{ label: "in force by the as-of date", value: "in_force" }, { label: "not yet in force", value: "not_yet_effective" }] });
    }
    for (const a of unknownAtoms(ev)) {
      const f = a.atom.field;
      if (f === "other") {
        const k = otherKey(a.atom);
        add({ id: `other:${k}`, kind: "missing_property_data", label: a.atom.description, ordered: false,
          cells: [{ label: "yes", value: true }, { label: "no", value: false }] });
      } else if (ORDERED.includes(f)) {
        const [lo, hi] = domain(f, p, asOf);
        add({ id: `fact:${f}`, kind: "missing_property_data", field: f, label: LABEL[f] ?? f, ordered: true,
          cells: partition(lo, hi, thresholdsFor(f, catRules, asOf)) });
      } else {
        const vals = new Set<string>();
        for (const r of catRules) for (const x of [...r.logic.conditions.flatMap((g) => g.any), ...r.logic.exemptions.flatMap((e) => e.all)])
          if (x.field === f) for (const v of x.value.split("|")) vals.add(v.trim().toLowerCase());
        const isBool = [...vals].every((v) => v === "true" || v === "false");
        const cells = isBool ? ["true", "false"] : [...vals, `other ${f.replaceAll("_", " ")}`];
        add({ id: `fact:${f}`, kind: "missing_property_data", field: f, label: LABEL[f] ?? f, ordered: false,
          cells: [...new Set(cells)].map((v) => ({ label: v, value: v })) });
      }
    }
  }
  // Disputed legal versions (sources disagree on the effective date).
  for (const r of catRules) {
    const alts = r.logic.disputed_effective_dates;
    if (!alts?.length) continue;
    const statuses = new Set([r.effective_date, ...alts].map((d) => temporalStatus({ ...r, effective_date: d }, asOf)));
    if (statuses.size > 1 && unknown.some((e) => e.rule_id === r.team_rule_id || byId.get(e.rule_id)?.category === r.category))
      add({ id: `dispute:${r.team_rule_id}`, kind: "disputed_legal_interpretation", label: `which effective date governs ${r.citation}`,
        ordered: false, cells: [r.effective_date, ...alts].map((d) => ({ label: `effective ${d}`, value: d })) });
  }
  return [...vars.values()];
}

function apply(p: Property, vars: Variable[], idx: number[], asOf: string, rules: Rule[]): { prop: Property; assume: Assumptions } | null {
  const facts: Facts = { ...p.facts };
  const assume: Assumptions = { other: {}, temporal: {} };
  let city = p.city;
  vars.forEach((v, i) => {
    const c = v.cells[idx[i]];
    if (v.id === "city") city = c.value === "another municipality" ? "(another municipality)" : (c.value as string);
    else if (v.id.startsWith("legal:")) assume.temporal![v.id.slice(6)] = c.value as Evaluation["temporal"];
    else if (v.id.startsWith("dispute:")) {
      const r = rules.find((x) => x.team_rule_id === v.id.slice(8))!;
      assume.temporal![r.team_rule_id] = temporalStatus({ ...r, effective_date: c.value as string }, asOf);
    } else if (v.id.startsWith("other:")) assume.other![v.id.slice(6)] = c.value as boolean;
    else if (v.field) {
      facts[v.field] = v.ordered
        ? { state: "known", lo: c.lo, hi: c.hi, source: "hypothetical" }
        : { state: "known", cat: String(c.value), source: "hypothetical" };
    }
  });
  // Dependency: the first CO cannot precede construction and is presumed within
  // CO_LAG_YEARS. Applied only to hypothetical CO values: an observed CO record is
  // never rejected by this presumption.
  const yb = facts.year_built, co = facts.co_date;
  const coObserved = co?.state === "known" && co.source !== "hypothetical";
  if (!coObserved && yb?.lo !== undefined && yb.hi !== undefined && co?.lo !== undefined && co.hi !== undefined && typeof yb.lo === "number") {
    const minCo = `${yb.lo}-01-01`, maxCo = `${(yb.hi as number) + CO_LAG_YEARS}-12-31`;
    if ((co.hi as string) < minCo || (co.lo as string) > maxCo) return null;
  }
  // Property-type consistency.
  const pt = facts.property_type?.cat, u = facts.units;
  if (u?.lo !== undefined && ((pt === "duplex" && (u.lo as number) > 2) || (pt === "single_family" && (u.lo as number) > 1))) return null;
  return { prop: { ...p, facts, city }, assume };
}

function merge(v: Variable, cellIdx: Set<number>): string | null {
  if (cellIdx.size === v.cells.length) return null; // unconstrained
  if (!v.ordered) return `${v.label}: ${[...cellIdx].sort().map((i) => v.cells[i].label).join(" or ")}`;
  const sorted = [...cellIdx].sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const i of sorted) { const last = runs.at(-1); if (last && last[1] === i - 1) last[1] = i; else runs.push([i, i]); }
  const n = v.cells.length - 1;
  return `${v.label} ${runs.map(([a, b]) => {
    const lo = v.cells[a].lo!, hi = v.cells[b].hi!;
    if (a === 0 && b === n) return "any value";
    if (a === 0) return `≤ ${fmt(hi)}`;
    if (b === n) return `≥ ${fmt(lo)}`;
    return lo === hi ? `= ${fmt(lo)}` : `${fmt(lo)} – ${fmt(hi)}`;
  }).join(" or ")}`;
}

function branchConditions(vars: Variable[], hits: { idx: number[] }[], all: { idx: number[] }[]): string[][] {
  const values = vars.map((_, i) => new Set(hits.map((h) => h.idx[i])));
  // Marginals are a complete condition only if their intersection includes no
  // other outcome. Otherwise retain the exact joint tuples, not a wider product.
  const matching = all.filter((c) => c.idx.every((value, i) => values[i].has(value)));
  if (matching.length === hits.length)
    return [vars.map((v, i) => merge(v, values[i])).filter((s): s is string => s !== null)];
  return hits.map((h) => vars.map((v, i) => merge(v, new Set([h.idx[i]]))).filter((s): s is string => s !== null));
}

// Kleene-level proofs: a missing fact inside an already-decided group is irrelevant.
function kleeneIrrelevance(ev: Evaluation): { fact: string; proof: string }[] {
  const out: { fact: string; proof: string }[] = [];
  for (const e of ev.exemptions) {
    if (e.presumed || e.truth !== "false") continue;
    const decider = e.atoms.find((a) => a.truth === "false");
    for (const a of e.atoms.filter((x) => x.truth === "unknown"))
      out.push({ fact: a.atom.description, proof: `Irrelevant here: exemption "${e.label}" also requires "${decider!.atom.description}", which is false (${decider!.fact}); a conjunction with a false part is false whatever "${a.atom.description}" is.` });
  }
  for (const c of ev.conditions) {
    if (c.truth !== "true") continue;
    const decider = c.atoms.find((a) => a.truth === "true");
    for (const a of c.atoms.filter((x) => x.truth === "unknown"))
      out.push({ fact: a.atom.description, proof: `Irrelevant here: the condition is already met by "${decider!.atom.description}" (${decider!.fact}).` });
  }
  return out;
}

export function resolveProperty(rules: Rule[], p: Property, asOf: string, opts: { limit?: number; assume?: Assumptions } = {}): PropertyResolution {
  const limit = opts.limit ?? MAX_COMPLETIONS;
  const base = evaluateProperty(rules, p, asOf, opts.assume);
  const byId = new Map(rules.map((r) => [r.team_rule_id, r]));
  const cities = [...new Set(rules.filter((r) => r.level === "city" && r.jurisdiction.endsWith(`, ${p.state}`)).map((r) => r.jurisdiction.split(",")[0]))];
  const out = base.map((ev) => ({
    ...ev,
    resolution: {
      method: "data", result: ev.result, completions: 1, exhaustive: true, variables: [], proof: "Decided directly by the supplied facts.",
      branches: [], decisive: [], irrelevant: kleeneIrrelevance(ev), established: [], next_action: null,
    } as Resolution,
  }));
  // A source dispute over the effective date that straddles the query date makes the
  // result conditional even when the chosen date alone would decide it.
  for (const ev of out) {
    const r = byId.get(ev.rule_id)!;
    const alts = r.logic.disputed_effective_dates;
    if (!alts?.length || ev.coverage === "false") continue;
    const st = new Set([r.effective_date, ...alts].map((d) => temporalStatus({ ...r, effective_date: d }, asOf)));
    if (st.size > 1) { ev.result = "unknown"; ev.resolution.result = "unknown"; ev.resolution.method = "conditional"; }
  }
  const blocking = new Map<string, BlockingFact>();
  let limitReached = false;

  for (const cat of [...new Set(rules.map((r) => r.category))]) {
    const catRules = rules.filter((r) => r.category === cat);
    const unknown = out.filter((e) => e.result === "unknown" && byId.get(e.rule_id)!.category === cat);
    if (!unknown.length) continue;
    const vars = buildVariables(unknown, catRules, byId, p, asOf, cities);
    const total = vars.reduce((n, v) => n * v.cells.length, 1);
    if (!vars.length || total > limit) {
      limitReached ||= total > limit;
      for (const ev of unknown) Object.assign(ev.resolution, {
        method: "limit_reached", result: "unknown", exhaustive: false, completions: 0, variables: vars.map((v) => v.id),
        proof: vars.length
          ? `Not checked exhaustively: ${total} combinations of ${vars.length} unknowns exceed the limit of ${limit}. The result stays unknown; no proof is claimed.`
          : "No enumerable variable: the gap is outside the modelled facts.",
      });
      continue;
    }
    // Enumerate admissible completions.
    const completions: { idx: number[]; results: Map<string, Result> }[] = [];
    const idx = vars.map(() => 0);
    for (let n = 0; n < total; n++) {
      const applied = apply(p, vars, idx, asOf, catRules);
      if (applied) {
        const evs = evaluateProperty(catRules, applied.prop, asOf, {
          other: { ...opts.assume?.other, ...applied.assume.other }, temporal: { ...opts.assume?.temporal, ...applied.assume.temporal } });
        completions.push({ idx: [...idx], results: new Map(evs.map((e) => [e.rule_id, e.result])) });
      }
      for (let i = 0; i < idx.length; i++) { if (++idx[i] < vars[i].cells.length) break; idx[i] = 0; }
    }
    if (!completions.length) {
      for (const ev of unknown) Object.assign(ev.resolution, {
        method: "review_required", result: "unknown", completions: 0, exhaustive: false,
        variables: vars.map((v) => v.id), irrelevant: [], established: [], branches: [],
        proof: "No admissible completion satisfies the supplied facts and model constraints. No coverage proof or outcome branches can be established.",
        next_action: "Review the conflicting facts and model constraints before answering clarification questions.",
      });
      continue;
    }
    for (const ev of unknown) {
      const res = completions.map((c) => c.results.get(ev.rule_id)!);
      const distinct = [...new Set(res)];
      const dependency = vars.map((v, vi) => {
        const groups = new Map<string, { results: Set<Result>; values: Set<number> }>();
        const byValue = new Map<number, Set<Result>>();
        completions.forEach((c, ci) => {
          const key = c.idx.filter((_, j) => j !== vi).join(",");
          const group = groups.get(key) ?? { results: new Set<Result>(), values: new Set<number>() };
          group.results.add(res[ci]); group.values.add(c.idx[vi]); groups.set(key, group);
          byValue.set(c.idx[vi], (byValue.get(c.idx[vi]) ?? new Set()).add(res[ci]));
        });
        return {
          decisive: [...groups.values()].some((g) => g.results.size > 1)
            || new Set([...byValue.values()].map((s) => [...s].sort().join(","))).size > 1,
          // No one-coordinate flip alone is insufficient under correlations.
          irrelevant: distinct.length === 1 || [...groups.values()].every((g) => g.results.size === 1 && g.values.size === v.cells.length),
        };
      });
      const decisive = vars.filter((_, i) => dependency[i].decisive);
      const relevantVars = vars.filter((v) => unknownAtoms(ev).some((a) => varOf(a.atom) === v.id) || v.id === "city" || v.id.endsWith(ev.rule_id) || decisive.includes(v));
      const irrelevantVars = relevantVars.filter((v) => dependency[vars.indexOf(v)].irrelevant);
      const irrelevant = irrelevantVars.map((v) => ({
        fact: v.label,
        proof: `Irrelevant within the checked model: every admissible change of "${v.label}" leaves this result unchanged across ${completions.length} completions.`,
      }));
      const r = ev.resolution;
      r.completions = completions.length;
      r.variables = vars.map((v) => v.id);
      r.decisive = decisive.map((v) => v.id);
      r.irrelevant = [...r.irrelevant, ...irrelevant];
      if (distinct.length === 1 && completions.length) {
        r.method = "constraints"; r.result = distinct[0]; ev.result = distinct[0];
        r.proof = `Every admissible combination (${completions.length}) of ${vars.map((v) => `"${v.label}"`).join(", ")} gives "${distinct[0]}", so the missing facts cannot change this answer.`;
      } else {
        r.method = "conditional"; r.result = "unknown";
        r.branches = distinct.map((d) => {
          const hits = completions.filter((_, ci) => res[ci] === d);
          return {
            result: d, completions: hits.length,
            when: branchConditions(vars, hits, completions),
          };
        });
        const covered = distinct.every((d) => d === "applies" || d === "superseded");
        const notDefinite = distinct.includes("not_applicable");
        r.established = [
          ...(covered ? ["The unit is covered by this rule in every case; only whether a local rule governs instead is open."] : []),
          ...(!notDefinite && !covered ? [`In every admissible case the result is one of: ${distinct.join(", ")}.`] : []),
        ];
        r.proof = `${decisive.length ? `Depends on ${decisive.map((v) => `"${v.label}"`).join(", ")}` : "Depends on unresolved joint facts"}: ${r.branches.map((b) => `${b.result} in ${b.completions} of ${completions.length} cases`).join("; ")}.`;
        const first = decisive[0] ?? relevantVars.find((v) => !irrelevantVars.includes(v));
        r.next_action = first ? (first.field && HINT[first.field] ? `Get ${first.label}: ${HINT[first.field]}.` : `Answer: ${questionFor(first)}`) : null;
      }
      for (const v of decisive) addBlock(blocking, v, ev.rule_id, true);
      for (const v of irrelevantVars) addBlock(blocking, v, ev.rule_id, false);
    }
  }
  // Disputed interpretations that do not change results still need human review.
  for (const ev of out) if (ev.conflict_flag) {
    const id = `preemption:${ev.rule_id}`;
    if (!blocking.has(id)) blocking.set(id, { id, kind: "disputed_legal_interpretation", label: `possible preemption/conflict involving ${ev.rule_id}`,
      question: "Human legal review: does the state law preempt the local ordinance?", options: [], decisive_for: [], irrelevant_for: [ev.rule_id], evidence_hint: null });
  }
  // Ordered questions offer the finest partition over every rule, so one answer settles all categories.
  for (const b of blocking.values()) {
    const f = b.id.startsWith("fact:") ? (b.id.slice(5) as Field) : null;
    if (f && ORDERED.includes(f)) { const [lo, hi] = domain(f, p, asOf); b.options = partition(lo, hi, thresholdsFor(f, rules, asOf)).map((c) => c.label); }
  }
  for (const ev of out) Object.assign(ev.resolution, answerConfidence(ev, byId.get(ev.rule_id)!));
  const list = [...blocking.values()];
  return {
    evaluations: out, blocking: list, limit_reached: limitReached,
    questions: list.filter((b) => b.decisive_for.length).sort((a, b) => b.decisive_for.length - a.decisive_for.length),
  };
}

// Confidence per answer, from the evidence path (transparent, rule-based):
// low = open/disputed; medium = presumptions, constraint proof, secondary source or
// modest extraction confidence; high = decided by observed facts from an official source.
export function answerConfidence(ev: Evaluation & { resolution: Resolution }, rule: Rule): { confidence: "high" | "medium" | "low"; confidence_reasons: string[] } {
  const low: string[] = [], mid: string[] = [];
  if (ev.result === "unknown") low.push("result depends on open facts or review");
  if (rule.logic.disputed_effective_dates?.length) low.push("sources disagree on the effective date");
  if (ev.conflict_flag) mid.push("possible conflict flagged for human review");
  if (ev.presumptions.length) mid.push(`relies on disclosed presumption(s): ${ev.presumptions.join("; ")}`);
  if (ev.resolution.method === "constraints") mid.push("proved by constraint reasoning over missing facts");
  if (!/^official/.test(rule.source.source_type)) mid.push(`source is ${rule.source.source_type}`);
  if ((rule.confidence ?? 1) < 0.85) mid.push(`extraction confidence ${rule.confidence}`);
  return low.length ? { confidence: "low", confidence_reasons: [...low, ...mid] }
    : mid.length ? { confidence: "medium", confidence_reasons: mid }
    : { confidence: "high", confidence_reasons: ["decided by observed facts and an official source"] };
}

function varOf(a: Atom): string { return a.field === "other" ? `other:${otherKey(a)}` : `fact:${a.field}`; }

function questionFor(v: Variable): string {
  if (v.field && QUESTION[v.field]) return QUESTION[v.field]!;
  if (v.id === "city") return "Which municipality is this address legally in?";
  if (v.kind === "missing_legal_version" || v.kind === "disputed_legal_interpretation") return `Confirm from the official legislative record: ${v.label}.`;
  return `Is this true for the property: "${v.label}"?`;
}

function addBlock(m: Map<string, BlockingFact>, v: Variable, ruleId: string, decisive: boolean) {
  const b = m.get(v.id) ?? {
    id: v.id, kind: v.kind, label: v.label, question: questionFor(v), options: v.cells.map((c) => c.label),
    decisive_for: [], irrelevant_for: [], evidence_hint: v.field ? HINT[v.field] ?? null : v.id === "city" ? "Census/State geocoder with a full street address" : null,
  };
  (decisive ? b.decisive_for : b.irrelevant_for).push(ruleId);
  m.set(v.id, b);
}

export { dateInterval };

// Targeted clarification: apply the user's answers (variable id -> option label) as a
// labelled hypothetical. Returns null if the answers are inconsistent with the facts.
export function applyAnswers(rules: Rule[], p: Property, asOf: string, answers: Record<string, string>):
  { prop: Property; assume: Assumptions; applied: { id: string; label: string; answer: string }[] } | null {
  const base = evaluateProperty(rules, p, asOf);
  const byId = new Map(rules.map((r) => [r.team_rule_id, r]));
  const cities = [...new Set(rules.filter((r) => r.level === "city" && r.jurisdiction.endsWith(`, ${p.state}`)).map((r) => r.jurisdiction.split(",")[0]))];
  const vars = buildVariables(base.filter((e) => e.result === "unknown"), rules, byId, p, asOf, cities);
  // Answers must be exactly one of the offered options (the finest threshold partition
  // for ordered facts, the listed values otherwise); anything else is rejected.
  const chosen: { v: Variable; i: number }[] = [];
  for (const id of Object.keys(answers)) if (!vars.some((v) => v.id === id)) return null;
  for (const v of vars) {
    const ans = answers[v.id];
    if (ans === undefined) continue;
    if (!v.ordered) { const i = v.cells.findIndex((c) => c.label === ans); if (i < 0) return null; chosen.push({ v, i }); continue; }
    const [dlo, dhi] = domain(v.field!, p, asOf);
    const cell = partition(dlo, dhi, thresholdsFor(v.field!, rules, asOf)).find((c) => c.label === ans);
    if (!cell) return null;
    v.cells.push(cell);
    chosen.push({ v, i: v.cells.length - 1 });
  }
  const res = apply(p, chosen.map((x) => x.v), chosen.map((x) => x.i), asOf, rules);
  if (!res) return null;
  for (const { v } of chosen) {
    if (v.id === "city") res.prop.city_evidence = `your answer (hypothetical): ${answers[v.id]}`;
    if (v.field) { const f = res.prop.facts[v.field]; if (f) { f.source = "your answer (hypothetical)"; f.state = "known"; } }
  }
  return { prop: res.prop, assume: res.assume, applied: chosen.map(({ v }) => ({ id: v.id, label: v.label, answer: answers[v.id] })) };
}

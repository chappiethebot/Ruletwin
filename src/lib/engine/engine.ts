// Deterministic evaluator. Strong Kleene three-valued logic over interval facts.
// No generated code is ever executed: atoms are allowlisted field/op/value triples.
import type {
  Atom, AtomTrace, Evaluation, Fact, Facts, Field, Property, Result, Rule, Truth,
} from "./types.ts";

export const and = (xs: Truth[]): Truth =>
  xs.includes("false") ? "false" : xs.every((x) => x === "true") ? "true" : "unknown";
export const or = (xs: Truth[]): Truth =>
  xs.includes("true") ? "true" : xs.every((x) => x === "false") ? "false" : "unknown";
export const not = (x: Truth): Truth => (x === "true" ? "false" : x === "false" ? "true" : "unknown");

const ORDERED: Field[] = ["year_built", "units", "co_date", "owner_portfolio_units"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Resolve "AS_OF-15Y" style values against the query date.
export function resolveValue(value: string, asOf: string): string {
  const m = /^AS_OF([+-]\d+)Y$/i.exec(value.trim());
  if (!m) return value.trim();
  const y = Number(asOf.slice(0, 4)) + Number(m[1]);
  return `${String(y).padStart(4, "0")}${asOf.slice(4)}`;
}

function cmpOrdered(lo: number | string, hi: number | string, op: Atom["op"], raw: string): Truth {
  if (op === "in") {
    // Membership in a list of points: decided when the interval is a point, or
    // when no listed value falls inside it.
    const vals = raw.split("|").map((x) => x.trim()).map((x) => (typeof lo === "number" ? Number(x) : x));
    if (vals.some((x) => typeof x === "number" && Number.isNaN(x))) return "unknown";
    if (lo === hi) return vals.includes(lo) ? "true" : "false";
    return vals.some((x) => x >= lo && x <= hi) ? "unknown" : "false";
  }
  const v: number | string = typeof lo === "number" ? Number(raw) : raw;
  if (typeof lo === "number" && Number.isNaN(v)) return "unknown";
  if (typeof lo === "string" && !DATE_RE.test(String(v))) return "unknown";
  switch (op) {
    case "lt": return hi < v ? "true" : lo >= v ? "false" : "unknown";
    case "le": return hi <= v ? "true" : lo > v ? "false" : "unknown";
    case "gt": return lo > v ? "true" : hi <= v ? "false" : "unknown";
    case "ge": return lo >= v ? "true" : hi < v ? "false" : "unknown";
    case "eq": return lo === v && hi === v ? "true" : v < lo || v > hi ? "false" : "unknown";
    case "ne": return not(cmpOrdered(lo, hi, "eq", raw));
    default: return "unknown";
  }
}

export function describeFact(f: Fact | undefined): string {
  if (!f || f.state === "missing") return `not in data${f?.note ? ` (${f.note})` : ""}`;
  const val = f.cat ?? (f.lo === f.hi ? String(f.lo) : `${f.lo}–${f.hi === Infinity ? "∞" : f.hi}`);
  return `${val}${f.state === "presumed" ? " (presumed)" : ""} · ${f.source}${f.note ? ` · ${f.note}` : ""}`;
}

// Hypothetical values used by constraint reasoning / clarification. Never stored as facts.
export interface Assumptions {
  other?: Record<string, boolean>; // keyed by otherKey(atom): shared across rules
  temporal?: Record<string, Evaluation["temporal"]>; // rule id -> legal status override
}

// Same untestable predicate worded in several rules shares one key.
export function otherKey(atom: Atom): string {
  const v = /^(true|false|yes|no)$/i.test(atom.value.trim()) ? atom.description : atom.value;
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 80);
}

export function evalAtom(atom: Atom, facts: Facts, asOf: string, assume?: Assumptions): AtomTrace {
  if (atom.field === "other" && assume?.other && otherKey(atom) in assume.other) {
    const t: Truth = assume.other[otherKey(atom)] ? "true" : "false";
    return { atom, truth: atom.negate ? not(t) : t, fact: `assumed ${assume.other[otherKey(atom)]}`, presumed: false };
  }
  const f = atom.field === "other" ? undefined : facts[atom.field];
  const value = resolveValue(atom.value, asOf);
  let truth: Truth = "unknown";
  if (f && f.state !== "missing") {
    if (atom.field === "year_built" && DATE_RE.test(value) && typeof f.lo === "number" && typeof f.hi === "number") {
      // Day-precision cutoff on a year-precision fact ("built on or before October 1,
      // 1978"): compare the whole year span, so the cutoff year stays unknown.
      truth = cmpOrdered(`${f.lo}-01-01`, `${f.hi}-12-31`, atom.op, value);
    } else if (ORDERED.includes(atom.field) && f.lo !== undefined && f.hi !== undefined) {
      truth = cmpOrdered(f.lo, f.hi, atom.op, value);
    } else if (f.cat !== undefined) {
      const list = value.split("|").map((s) => s.trim().toLowerCase());
      const hit = list.includes(f.cat.toLowerCase());
      if (atom.op === "eq" || atom.op === "in") truth = hit ? "true" : "false";
      else if (atom.op === "ne") truth = hit ? "false" : "true";
    }
  }
  if (atom.negate) truth = not(truth);
  return { atom, truth, fact: describeFact(f), presumed: f?.state === "presumed" && truth !== "unknown" };
}

// Partial dates ("2025", "2025-06") become [first day, last day].
export function dateInterval(d: string): [string, string] {
  if (/^\d{4}$/.test(d)) return [`${d}-01-01`, `${d}-12-31`];
  if (/^\d{4}-\d{2}$/.test(d)) {
    const [y, m] = d.split("-").map(Number);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return [`${d}-01`, `${d}-${String(last).padStart(2, "0")}`];
  }
  return [d, d];
}

export function temporalStatus(rule: Rule, asOf: string): Evaluation["temporal"] {
  if (rule.logic.status_kind === "pending") return "pending"; // pending never self-enacts
  if (rule.logic.status_kind === "failed") return "failed";
  if (!rule.effective_date) return "in_force"; // enacted, no stated date: current law per source
  const [lo, hi] = dateInterval(rule.effective_date);
  if (asOf >= hi) return "in_force";
  if (asOf < lo) return "not_yet_effective";
  return "date_ambiguous";
}

// Export status as of a query date (official enum).
export function officialStatus(rule: Rule, asOf: string): Rule["status"] {
  const t = temporalStatus(rule, asOf);
  return t === "date_ambiguous" ? "in_force" : t;
}

export function jurisdictionMatch(rule: Rule, p: Property): Truth {
  if (rule.level === "state") return rule.jurisdiction === p.state ? "true" : "false";
  const [city, st] = rule.jurisdiction.split(",").map((s) => s.trim());
  if (st !== p.state) return "false";
  if (p.city === null) return "unknown";
  return p.city.toLowerCase() === city.toLowerCase() ? "true" : "false";
}

const STATUS_LABEL: Record<Evaluation["temporal"], string> = {
  in_force: "in force",
  not_yet_effective: "enacted but not yet effective",
  pending: "a pending proposal, not law",
  failed: "a failed measure",
  date_ambiguous: "effective date falls inside a partially stated date",
};

// Evaluate one rule for one property, ignoring cross-rule precedence.
export function evaluateRule(rule: Rule, p: Property, asOf: string, assume?: Assumptions): Evaluation {
  const jurisdiction = jurisdictionMatch(rule, p);
  const temporal = assume?.temporal?.[rule.team_rule_id] ?? temporalStatus(rule, asOf);
  // Empty groups/exemptions carry no testable predicate; they are flagged at publish
  // time and must not vacuously decide coverage.
  const conditions = rule.logic.conditions.filter((g) => g.any.length).map((g) => {
    const atoms = g.any.map((a) => evalAtom(a, p.facts, asOf, assume));
    return { truth: or(atoms.map((a) => a.truth)), atoms };
  });
  const exemptions = rule.logic.exemptions.filter((e) => e.all.length).map((e) => {
    const atoms = e.all.map((a) => evalAtom(a, p.facts, asOf, assume));
    const truth = and(atoms.map((a) => a.truth));
    return { label: e.label, truth: e.presumed_inapplicable && truth === "unknown" ? "false" as const : truth, atoms, presumed: Boolean(e.presumed_inapplicable && truth === "unknown") };
  });
  const coverage = and([
    jurisdiction,
    ...conditions.map((c) => c.truth),
    not(or(exemptions.map((e) => e.truth))),
  ]);
  const allAtoms = [...conditions.flatMap((c) => c.atoms), ...exemptions.filter((e) => !e.presumed).flatMap((e) => e.atoms)];
  // A missing fact matters only if its atom is unresolved.
  const missing_facts = [...new Set(allAtoms.filter((a) => a.truth === "unknown").map((a) => a.atom.field))];
  const presumptions = [
    ...new Set(allAtoms.filter((a) => a.presumed).map((a) => `${a.atom.field}: ${a.fact}`)),
    ...exemptions.filter((e) => e.presumed).map((e) => `exemption "${e.label}" does not apply (not determinable from data)`),
  ];

  let result: Result;
  if (coverage === "false" || temporal === "failed") result = "not_applicable";
  else if (temporal === "pending") result = "pending";
  else if (temporal === "not_yet_effective") result = "not_yet_effective";
  else if (temporal === "date_ambiguous" || coverage === "unknown") result = "unknown";
  else result = "applies";

  const ev: Evaluation = {
    rule_id: rule.team_rule_id, result, jurisdiction, coverage, temporal, conditions, exemptions,
    missing_facts, presumptions, superseded_by: [], conflict_with: [], conflict_flag: false, explanation: "",
  };
  ev.explanation = explain(rule, ev, p);
  return ev;
}

function explain(rule: Rule, ev: Evaluation, p: Property): string {
  const where = rule.level === "state" ? `Statewide ${rule.jurisdiction} rule` : `${rule.jurisdiction} city rule`;
  const parts = [`${where}; ${STATUS_LABEL[ev.temporal]}${rule.effective_date ? ` (effective ${rule.effective_date})` : ""}.`];
  if (ev.jurisdiction === "unknown") parts.push(`Legal city for this address is unresolved (${p.city_evidence}).`);
  const decided = [...ev.conditions.flatMap((c) => c.atoms), ...ev.exemptions.flatMap((e) => e.atoms)];
  const unknowns = decided.filter((a) => a.truth === "unknown");
  if (ev.coverage === "true") parts.push("Coverage conditions are met on the supplied facts.");
  if (unknowns.length && ev.coverage === "unknown")
    parts.push(`Coverage depends on facts not in the data: ${unknowns.map((a) => a.atom.description).join("; ")}.`);
  for (const e of ev.exemptions) if (e.truth === "true") parts.push(`Exemption applies: ${e.label}.`);
  if (ev.presumptions.length) parts.push(`Assumes ${ev.presumptions.join("; ")}.`);
  if (ev.superseded_by.length) parts.push(`A local rule in the same category governs: ${ev.superseded_by.join(", ")}.`);
  else if (rule.logic.yields_to_local && ev.result === "unknown" && ev.coverage === "true")
    parts.push("Covered, but it yields where a local rule covers this unit, and local coverage is undetermined.");
  if (ev.conflict_flag) parts.push(`Possible conflict/preemption with ${ev.conflict_with.join(", ")}; flagged for human review.`);
  return parts.join(" ");
}

// Evaluate every rule for one property, then apply evidence-backed precedence:
// a rule marked yields_to_local is superseded only where a same-category city rule
// (that does not itself yield) actually applies; unresolved local coverage keeps it
// unknown. conflict_with_local flags both sides for human review.
export function evaluateProperty(rules: Rule[], p: Property, asOf: string, assume?: Assumptions): Evaluation[] {
  const evs = rules.map((r) => evaluateRule(r, p, asOf, assume));
  const byId = new Map(rules.map((r) => [r.team_rule_id, r]));
  for (const ev of evs) {
    const rule = byId.get(ev.rule_id)!;
    if (ev.result === "not_applicable") continue;
    const locals = evs.filter((o) => {
      const r = byId.get(o.rule_id)!;
      return o !== ev && r.level === "city" && r.category === rule.category && o.result !== "not_applicable" && !r.logic.yields_to_local;
    });
    if (rule.logic.yields_to_local && ev.result === "applies") {
      const governing = locals.filter((o) => o.result === "applies");
      if (governing.length) {
        ev.result = "superseded";
        ev.superseded_by = governing.map((o) => o.rule_id);
      } else if (locals.some((o) => o.result === "unknown")) {
        ev.result = "unknown";
        ev.missing_facts = [...new Set([...ev.missing_facts, ...locals.flatMap((o) => o.missing_facts)])];
      }
    }
    if (rule.level === "state" && rule.logic.conflict_with_local && locals.length) {
      ev.conflict_flag = true;
      ev.conflict_with = locals.map((o) => o.rule_id);
      for (const o of locals) {
        o.conflict_flag = true;
        o.conflict_with = [...new Set([...o.conflict_with, rule.team_rule_id])];
        o.explanation = explain(byId.get(o.rule_id)!, o, p);
      }
    }
    ev.explanation = explain(rule, ev, p);
  }
  return evs;
}

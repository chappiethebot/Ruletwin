// Change tracking: compare evaluations for the same properties/facts across two
// dates, or under a labelled hypothetical overlay (pending bill enacted).
import { applyPropertyEvidence, type EvidenceRecord } from "./evidence.ts";
import { resolveProperty } from "./resolve.ts";
import type { Evaluation, Property, Rule } from "./types.ts";

export interface ChangeTest {
  test_id: string;
  title: string;
  type: string; // as_of | boundary | pending | negative | (new types fall back to as_of/boundary)
  rule_ids: string[]; // organizer ids, e.g. "HOB-ALG-01"
  as_of?: string;
  as_of_before?: string;
  as_of_after?: string;
  states?: string[];
  conflict_with?: string[];
  expected_behavior?: string;
  team_rule_ids?: string[]; // explicit targets (e.g. rules extracted from a newly ingested document)
}

export interface PropertyChange {
  address_id: string;
  kind: "definite" | "possible";
  before: Pick<Evaluation, "rule_id" | "result" | "conflict_flag">[];
  after: Pick<Evaluation, "rule_id" | "result" | "conflict_flag">[];
}

export interface ChangeResult {
  test_id: string;
  title: string;
  mode: string;
  before_label: string;
  after_label: string;
  matched_rule_ids: string[];
  affected: PropertyChange[];
  conflict_flag_address_ids: string[];
  notes: string;
}

const CAT: Record<string, Rule["category"]> = {
  ALG: "algorithmic_rent_setting", RENT: "rent_increase_limits", RC: "rent_increase_limits",
  JC: "just_cause_eviction", JCE: "just_cause_eviction", EVICT: "just_cause_eviction",
  DEP: "security_deposits", FEE: "application_screening_fees", SCR: "screening_restrictions", SCREEN: "screening_restrictions",
};
const JUR: Record<string, string> = {
  CA: "CA", NJ: "NJ", MA: "MA", HOB: "Hoboken, NJ", JC: "Jersey City, NJ", JCY: "Jersey City, NJ", NWK: "Newark, NJ",
  NEW: "Newark, NJ", SF: "San Francisco, CA", LA: "Los Angeles, CA", SD: "San Diego, CA", BER: "Berkeley, CA",
  BRK: "Berkeley, CA", SA: "Santa Ana, CA", BOS: "Boston, MA", CAM: "Cambridge, MA", CAMB: "Cambridge, MA",
};

// Organizer id "HOB-ALG-01" / "MA-ALG-P1" -> our rules with that jurisdiction and category.
// Proposal aliases ("P1", "P2") are matched individually: the n-th bill number named in
// the test title selects the rule citing that bill; otherwise the test type decides the
// stage (negative -> failed, pending -> pending). Ambiguity is reported, never hidden.
export function matchRules(orgId: string, rules: Rule[], test?: Pick<ChangeTest, "title" | "type">): { rules: Rule[]; note: string | null } {
  const [j, c, n = ""] = orgId.toUpperCase().split("-");
  const jur = JUR[j], cat = CAT[c];
  if (!jur || !cat) return { rules: [], note: `${orgId}: unknown jurisdiction/category code` };
  const hits = rules.filter((r) => r.jurisdiction === jur && r.category === cat);
  const p = /^P(\d+)/.exec(n);
  if (!p) {
    const enacted = hits.filter((r) => r.logic.status_kind === "enacted");
    return { rules: enacted.length ? enacted : hits, note: null };
  }
  let proposals = hits.filter((r) => r.logic.status_kind !== "enacted");
  const bills = [...(test?.title ?? "").matchAll(/\b([SHA])\.?\s?(\d{3,5})\b/g)].map((m) => m[2]);
  const bill = bills[Number(p[1]) - 1];
  if (bill) proposals = proposals.filter((r) => (r.citation.match(/\d+/g) ?? ([] as string[])).includes(bill));
  else if (test?.type === "negative") proposals = proposals.filter((r) => r.logic.status_kind === "failed");
  else if (test?.type === "pending") proposals = proposals.filter((r) => r.logic.status_kind === "pending");
  const note = proposals.length === 1 ? null : `${orgId}: ${proposals.length} matching rules${proposals.length ? " (ambiguous)" : ""}`;
  return { rules: proposals, note };
}

const slim = (e: Evaluation) => ({ rule_id: e.rule_id, result: e.result, conflict_flag: e.conflict_flag });

// Same path as the address report: evidence valid on that date, then constraint resolution.
function evaluateOn(rules: Rule[], p: Property, date: string, evidence?: EvidenceRecord[]): Evaluation[] {
  return resolveProperty(rules, evidence ? applyPropertyEvidence(p, evidence, date).property : p, date).evaluations;
}

export function runChange(test: ChangeTest, rules: Rule[], props: Property[], override?: string[], evidence?: EvidenceRecord[]): ChangeResult {
  const ruleOverride = override ?? (test.rule_ids.length ? undefined : test.team_rule_ids);
  const matched = test.rule_ids.map((id) => matchRules(id, rules, test));
  const targets = ruleOverride
    ? rules.filter((r) => ruleOverride.includes(r.team_rule_id))
    : [...new Set(matched.flatMap((m) => m.rules))];
  const aliasNotes = ruleOverride ? [] : matched.map((m) => m.note).filter(Boolean) as string[];
  const ids = new Set(targets.map((r) => r.team_rule_id));
  const conflictIds = new Set((test.conflict_with ?? []).flatMap((id) => matchRules(id, rules).rules).map((r) => r.team_rule_id));
  const pick = (evs: Evaluation[]) => evs.filter((e) => ids.has(e.rule_id));
  const inScope = (p: Property) => !test.states?.length || test.states.includes(p.state);

  let mode = test.type, beforeLabel = "", afterLabel = "";
  let evalBefore: (p: Property) => Evaluation[];
  let evalAfter: (p: Property) => Evaluation[];

  if (test.type === "pending") {
    // Hypothetical: the pending bill enacted and effective on the query date (in memory only).
    const d = test.as_of ?? "2026-10-01";
    const overlay = rules.map((r) => ids.has(r.team_rule_id)
      ? { ...r, effective_date: null, logic: { ...r.logic, status_kind: "enacted" as const } } : r);
    evalBefore = (p) => evaluateOn(rules, p, d, evidence);
    evalAfter = (p) => evaluateOn(overlay, p, d, evidence);
    beforeLabel = `actual law, ${d}`; afterLabel = `hypothetical: pending bill(s) enacted, ${d}`;
  } else if (test.as_of_before && test.as_of_after) {
    evalBefore = (p) => evaluateOn(rules, p, test.as_of_before!, evidence);
    evalAfter = (p) => evaluateOn(rules, p, test.as_of_after!, evidence);
    beforeLabel = test.as_of_before; afterLabel = test.as_of_after; mode = "as_of";
  } else {
    // boundary / negative / single-date: which properties carry the rule at all.
    const d = test.as_of ?? "2026-10-01";
    evalBefore = () => [];
    evalAfter = (p) => evaluateOn(rules, p, d, evidence);
    beforeLabel = "rule absent"; afterLabel = d; mode = test.type === "negative" ? "negative" : "boundary";
  }

  const affected: PropertyChange[] = [];
  const conflictAddrs: string[] = [];
  for (const p of props) {
    if (!inScope(p)) continue;
    const b = pick(evalBefore(p)), a = pick(evalAfter(p));
    const flagged = [...b, ...a].some((e) => e.conflict_flag && (!conflictIds.size || e.conflict_with.some((c) => conflictIds.has(c))));
    if (flagged && conflictIds.size) conflictAddrs.push(p.address_id);
    // Any change in either direction counts, including loss of coverage.
    const res = (list: Evaluation[], id: string) => list.find((x) => x.rule_id === id)?.result ?? "not_applicable";
    const changed = [...ids].filter((id) => res(b, id) !== res(a, id));
    if (!changed.length) continue;
    affected.push({
      address_id: p.address_id,
      kind: changed.every((id) => res(b, id) !== "unknown" && res(a, id) !== "unknown") ? "definite" : "possible",
      before: b.filter((e) => e.result !== "not_applicable").map(slim),
      after: a.filter((e) => e.result !== "not_applicable").map(slim),
    });
  }
  const def = affected.filter((x) => x.kind === "definite").length;
  const notes = targets.length
    ? `${mode}: ${afterLabel} vs ${beforeLabel}.${aliasNotes.length ? ` Alias matching: ${aliasNotes.join("; ")}.` : ""} Rules: ${targets.map((r) => `${r.team_rule_id} (${r.citation}, ${r.logic.status_kind}${r.effective_date ? `, eff. ${r.effective_date}` : ""})`).join("; ")}. ${def} definitely affected, ${affected.length - def} possibly affected (coverage depends on facts not in the data).${mode === "negative" ? " A failed or struck measure never takes effect, so no address is affected." : ""}`
    : `No extracted rule matches ${test.rule_ids.join(", ")}; nothing reported rather than guessing.`;
  return {
    test_id: test.test_id, title: test.title, mode, before_label: beforeLabel, after_label: afterLabel,
    matched_rule_ids: [...ids], affected, conflict_flag_address_ids: conflictAddrs, notes,
  };
}

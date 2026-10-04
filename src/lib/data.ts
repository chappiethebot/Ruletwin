import "server-only";
import fs from "node:fs";
import path from "node:path";
import { evaluateProperty } from "./engine/engine.ts";
import type { ChangeResult } from "./engine/changes.ts";
import type { Evaluation, Property, Rule } from "./engine/types.ts";
import { applyPropertyEvidence, isCalendarDate, type EvidenceRecord } from "./engine/evidence.ts";
import { applyAnswers, resolveProperty, type PropertyResolution } from "./engine/resolve.ts";

export interface Snapshot {
  id: string;
  created_at: string;
  engine_version: string;
  default_as_of: string;
  rule_count: number;
  property_count: number;
  documents: Record<string, { doc_id: string; disposition: string; accepted: number; rejected: { title: string; reason: string }[]; error?: string }>;
  rules: Rule[];
  properties: Property[];
  changes: ChangeResult[];
  evidence?: EvidenceRecord[];
  address_audit?: { address_id: string; outcome: string; evidence: { id: string; adapter: string; value: unknown; status: string; reasons: string[] }[]; request: string | null }[];
  previous?: string | null;
}

const SNAP_DIR = path.join(process.cwd(), "data", "snapshots");
const cache = new Map<string, Snapshot>();

export function activeSnapshotId(): string | null {
  const p = path.join(SNAP_DIR, "active.json");
  return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf8")).id as string) : null;
}

// Snapshots are immutable, so caching by id is safe.
export function getSnapshot(id = activeSnapshotId()): Snapshot | null {
  if (!id || !/^snap-[a-f0-9]+$/.test(id)) return null;
  if (!cache.has(id)) {
    const p = path.join(SNAP_DIR, id, "snapshot.json");
    if (!fs.existsSync(p)) return null;
    const snap = JSON.parse(fs.readFileSync(p, "utf8")) as Snapshot;
    const ptr = path.join(SNAP_DIR, "active.json");
    snap.previous = fs.existsSync(ptr) ? JSON.parse(fs.readFileSync(ptr, "utf8")).previous ?? null : null;
    // JSON has no Infinity; open-ended unit ranges are serialized as null.
    for (const p of snap.properties) for (const f of Object.values(p.facts)) if (f && f.hi === null) f.hi = Infinity;
    cache.set(id, snap);
  }
  return cache.get(id)!;
}

// One document-ID contract for ingestion, publication and loading (D001, S037, T6A ...).
export const DOC_ID = /^[A-Za-z][A-Za-z0-9_-]{0,39}$/;

export function docText(snapId: string, docId: string): string | null {
  if (!DOC_ID.test(docId)) return null;
  const p = path.join(SNAP_DIR, snapId, `${docId}.txt`);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
}

// Real calendar dates only (2026-02-30 is rejected, not rolled over).
export const isDate = isCalendarDate;

export function evaluate(snap: Snapshot, propertyId: string, asOf: string): { property: Property; evaluations: Evaluation[] } | null {
  const property = snap.properties.find((p) => p.address_id === propertyId);
  if (!property) return null;
  return { property, evaluations: evaluateProperty(snap.rules, property, asOf) };
}

// Full resolution for one property: evidence valid on the date, then constraint
// reasoning, then (optionally) the user's hypothetical answers to clarification questions.
export function resolveFor(snap: Snapshot, propertyId: string, asOf: string, answers: Record<string, string> = {}) {
  const raw = snap.properties.find((p) => p.address_id === propertyId);
  if (!raw) return null;
  const ev = applyPropertyEvidence(raw, snap.evidence ?? [], asOf);
  const answered = Object.keys(answers).length ? applyAnswers(snap.rules, ev.property, asOf, answers) : null;
  const property = answered?.prop ?? ev.property;
  const resolution: PropertyResolution = resolveProperty(snap.rules, property, asOf, { assume: answered?.assume });
  const records = (snap.evidence ?? []).filter((r) => r.subject.property_id === propertyId);
  const audit = snap.address_audit?.find((a) => a.address_id === propertyId) ?? null;
  return { property, resolution, evidence: { used: ev.used, ignored: ev.ignored, conflicts: ev.conflicts, records }, audit,
    answers: answered?.applied ?? [], inconsistent: Object.keys(answers).length > 0 && !answered };
}

// Evidence for one rule: the quoted span in context plus separate condition quotes.
export interface Evidence {
  in_corpus: boolean; // false = team-captured copy of a link-only page (not a corpus citation)
  citation: string;
  url: string | null;
  retrieved_at: string | null;
  source_type: string;
  doc_id: string;
  effective_date: string | null;
  status_kind: string;
  snapshot_id: string;
  before: string;
  quote: string;
  after: string;
  condition_quotes: { label: string; quote: string }[];
  review: string[];
  model: string;
}

export function evidenceFor(snap: Snapshot, rule: Rule): Evidence {
  const text = docText(snap.id, rule.source.doc_id) ?? "";
  const { start, end } = rule.source;
  const ok = text.slice(start, end) === rule.quoted_span;
  const url = /^https?:\/\//i.test(rule.source_url) ? rule.source_url : null;
  return {
    citation: rule.citation, url, retrieved_at: rule.source.retrieved_at, source_type: rule.source.source_type,
    in_corpus: /^D\d+$/.test(rule.source.doc_id),
    doc_id: rule.source.doc_id, effective_date: rule.effective_date, status_kind: rule.logic.status_kind,
    snapshot_id: snap.id,
    before: ok ? text.slice(Math.max(0, start - 500), start) : "",
    quote: rule.quoted_span,
    after: ok ? text.slice(end, end + 500) : "",
    condition_quotes: [
      ...rule.logic.conditions.flatMap((g) => g.any.map((a) => ({ label: `Condition: ${a.description}`, quote: a.quote }))),
      ...rule.logic.exemptions.map((e) => ({ label: `Exemption: ${e.label}`, quote: e.quote })),
    ].filter((q) => q.quote),
    review: rule.extraction.review,
    model: rule.extraction.model,
  };
}

// Audit view: one row per reported answer with its source, retrieval date, as-of date
// and reasoning boundary (how it was decided and what it rests on).
export function auditRows(snap: Snapshot, r: NonNullable<ReturnType<typeof resolveFor>>, asOf: string) {
  const byRule = new Map(snap.rules.map((x) => [x.team_rule_id, x]));
  const labels = Object.fromEntries(r.resolution.blocking.map((b) => [b.id, b.label]));
  return r.resolution.evaluations.filter((e) => e.result !== "not_applicable").map((e) => {
    const rule = byRule.get(e.rule_id)!;
    const res = e.resolution;
    const boundary = res.method === "data" ? "decided by supplied facts"
      : res.method === "constraints" ? "proved across all admissible values of missing facts"
      : res.method === "conditional" ? `open: depends on ${res.decisive.map((d) => labels[d] ?? d).join(", ") || "joint facts"}`
      : res.method === "limit_reached" ? "not checked exhaustively (computation limit)" : "needs human review";
    return {
      rule_id: e.rule_id, title: rule.title, citation: rule.citation, result: e.result, as_of: asOf,
      source_doc_id: rule.source.doc_id, in_supplied_corpus: /^D\d+$/.test(rule.source.doc_id),
      source_url: rule.source_url, retrieved_at: rule.source.retrieved_at, quoted_span: rule.quoted_span,
      reasoning_boundary: boundary, presumptions: e.presumptions, conflict_flag: e.conflict_flag,
      confidence: res.confidence ?? null, extracted_by: `${rule.extraction.model} · ${rule.extraction.prompt_version}`,
      snapshot: snap.id, evidence_used: r.evidence.used,
    };
  });
}

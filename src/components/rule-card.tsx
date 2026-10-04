import { Check, CircleHelp, X } from "lucide-react";
import { GitBranch, ArrowRight, ShieldCheck } from "lucide-react";
import type { AtomTrace, Evaluation, Rule, Truth } from "@/lib/engine/types";
import type { Resolution } from "@/lib/engine/resolve";
import type { Evidence } from "@/lib/data";
import { ConflictBadge, StatusBadge } from "./ui";
import { EvidenceDrawer } from "./evidence-drawer";

const TRUTH: Record<Truth, { Icon: typeof Check; label: string; cls: string }> = {
  true: { Icon: Check, label: "true", cls: "text-teal" },
  false: { Icon: X, label: "false", cls: "text-crimson" },
  unknown: { Icon: CircleHelp, label: "unknown", cls: "text-amber" },
};

function TruthMark({ t }: { t: Truth }) {
  const s = TRUTH[t];
  return <span className={`inline-flex items-center gap-1 font-mono text-[12px] ${s.cls}`}><s.Icon aria-hidden size={14} />{s.label}</span>;
}

function Atoms({ atoms }: { atoms: AtomTrace[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {atoms.map((a, i) => (
        <li key={i} className="grid grid-cols-[84px_1fr] gap-2 text-[14px]">
          <TruthMark t={a.truth} />
          <span>{a.atom.description}<span className="block text-[13px] text-muted">Fact: {a.fact}</span></span>
        </li>
      ))}
    </ul>
  );
}

export function RuleCard({ rule, ev, evidence, labels = {} }: { rule: Rule; ev: Evaluation & { resolution?: Resolution }; evidence: Evidence; labels?: Record<string, string> }) {
  const res = ev.resolution;
  const conditional = res && (res.method === "conditional" || res.method === "limit_reached" || res.method === "review_required");
  return (
    <article className="rounded-xl border border-line bg-card p-5" aria-labelledby={`t-${rule.team_rule_id}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <h3 id={`t-${rule.team_rule_id}`} className="text-[17px] font-semibold leading-snug">{rule.title}</h3>
          <p className="break-words font-mono text-[13px] text-muted">{rule.citation} · {rule.jurisdiction} · {rule.team_rule_id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {conditional && res.method === "conditional" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber-soft px-2.5 py-0.5 text-[13px] font-medium text-amber">
              <GitBranch aria-hidden size={14} /> {res.decisive.length ? `Depends on ${res.decisive.map((d) => labels[d] ?? d).slice(0, 2).join(" + ")}` : "Depends on joint facts"}
            </span>
          ) : <StatusBadge result={ev.result} />}
          {ev.conflict_flag && <ConflictBadge />}
          {!evidence.in_corpus && (
            <span className="inline-flex items-center rounded-full border border-crimson/30 px-2.5 py-0.5 text-[13px] font-medium text-crimson" title="Quoted from a team-captured copy of a link-only page; not supplied corpus text">
              Source outside supplied corpus
            </span>
          )}
          {res?.confidence && (
            <span title={res.confidence_reasons?.join("; ")}
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[13px] font-medium ${res.confidence === "high" ? "border-teal/30 text-teal" : res.confidence === "medium" ? "border-amber/30 text-amber" : "border-crimson/30 text-crimson"}`}>
              Confidence: {res.confidence}
            </span>
          )}
        </div>
      </div>
      <p className="mt-3">{rule.requirement}</p>
      {rule.key_value && <p className="mt-2 text-[14px]"><span className="text-muted">Key value: </span><strong>{rule.key_value}</strong></p>}
      {rule.exemptions && <p className="mt-1 text-[14px] text-muted">Exemptions in the law: {rule.exemptions}</p>}
      <p className="mt-3 rounded-lg bg-bg p-3 text-[14px]">{ev.explanation}</p>
      {res?.method === "constraints" && (
        <p className="mt-2 flex gap-2 text-[14px] text-teal"><ShieldCheck aria-hidden size={16} className="mt-0.5 shrink-0" /><span><strong>Proven despite missing data:</strong> {res.proof}</span></p>
      )}
      {conditional && (
        <div className="mt-3 rounded-lg border border-amber/30 p-3 text-[14px]">
          {res.established.length > 0 && (
            <p className="mb-2"><strong>Established in every case:</strong> {res.established.join(" ")}</p>
          )}
          {res.branches.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="font-semibold">Outcomes ({res.completions} admissible cases checked{res.exhaustive ? ", exhaustive" : ""}):</p>
              {res.branches.map((b) => (
                <div key={b.result} className="flex flex-wrap items-center gap-2">
                  <StatusBadge result={b.result} />
                  <span className="text-muted">when {b.when.slice(0, 3).map((group) => `(${group.join(" AND ") || "every admissible case"})`).join(" OR ")}</span>
                  {b.when.length > 3 && (
                    <details className="basis-full">
                      <summary className="flex min-h-11 cursor-pointer items-center font-medium text-teal">Show all {b.when.length} condition combinations</summary>
                      <ul className="list-disc pl-5 text-muted">{b.when.map((group, i) => <li key={i}>{group.join(" AND ")}</li>)}</ul>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
          {(res.method === "limit_reached" || res.method === "review_required") && <p className="text-amber">{res.proof}</p>}
          {res.next_action && (
            <p className="mt-2 flex gap-2"><ArrowRight aria-hidden size={16} className="mt-0.5 shrink-0 text-teal" /><span><strong>Next action:</strong> {res.next_action}</span></p>
          )}
        </div>
      )}
      {(rule.conflict_note || rule.interaction) && (
        <p className="mt-2 text-[14px] text-muted">{[rule.interaction, rule.conflict_note].filter(Boolean).join(" ")}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <EvidenceDrawer evidence={evidence} title={rule.title} />
        <details className="min-w-0 flex-1 basis-full sm:basis-auto">
          <summary className="flex min-h-11 cursor-pointer items-center text-[14px] font-medium text-teal">Show reasoning</summary>
          <div className="mt-2 flex flex-col gap-3 rounded-lg border border-line p-4">
            <div className="grid grid-cols-[110px_1fr] gap-2 text-[14px]">
              <span className="text-muted">Jurisdiction</span><TruthMark t={ev.jurisdiction} />
              <span className="text-muted">Legal status</span><span className="font-mono text-[13px]">{ev.temporal}</span>
              <span className="text-muted">Coverage</span><TruthMark t={ev.coverage} />
            </div>
            {ev.conditions.length === 0 && ev.exemptions.length === 0 && (
              <p className="text-[14px] text-muted">No property-level conditions extracted: the rule covers all residential rentals in its jurisdiction.</p>
            )}
            {ev.conditions.map((c, i) => (
              <div key={i}>
                <p className="mb-1 text-[13px] font-semibold">Condition {i + 1} (any of) → <TruthMark t={c.truth} /></p>
                <Atoms atoms={c.atoms} />
              </div>
            ))}
            {ev.exemptions.map((e, i) => (
              <div key={i}>
                <p className="mb-1 text-[13px] font-semibold">Exemption: {e.label} (all of) → <TruthMark t={e.truth} /></p>
                <Atoms atoms={e.atoms} />
              </div>
            ))}
            {res && res.irrelevant.length > 0 && (
              <div>
                <p className="mb-1 text-[13px] font-semibold">Missing facts that cannot change this answer</p>
                <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px] text-muted">{res.irrelevant.map((x, i) => <li key={i}>{x.proof}</li>)}</ul>
              </div>
            )}
            {ev.superseded_by.length > 0 && <p className="text-[14px]">Yields to: <span className="font-mono">{ev.superseded_by.join(", ")}</span></p>}
            {ev.conflict_with.length > 0 && <p className="text-[14px]">Possible conflict with: <span className="font-mono">{ev.conflict_with.join(", ")}</span></p>}
          </div>
        </details>
      </div>
    </article>
  );
}

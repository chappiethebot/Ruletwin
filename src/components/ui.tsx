import { CheckCircle2, CircleHelp, Clock, FileClock, Layers, MinusCircle, TriangleAlert } from "lucide-react";
import type { Category, Result } from "@/lib/engine/types";

export const CATEGORY_LABEL: Record<Category, string> = {
  rent_increase_limits: "Rent increase limits",
  just_cause_eviction: "Just-cause eviction",
  security_deposits: "Security deposits",
  application_screening_fees: "Application & screening fees",
  screening_restrictions: "Screening restrictions",
  algorithmic_rent_setting: "Algorithmic rent-setting",
};

const STATUS: Record<Result, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  applies: { label: "Applies", cls: "bg-teal-soft text-teal border-teal/30", Icon: CheckCircle2 },
  unknown: { label: "Unknown — needs facts", cls: "bg-amber-soft text-amber border-amber/30", Icon: CircleHelp },
  superseded: { label: "Superseded by local rule", cls: "bg-slate-soft text-ink border-line", Icon: Layers },
  not_yet_effective: { label: "Not yet effective", cls: "bg-violet-soft text-violet border-violet/30", Icon: Clock },
  pending: { label: "Pending — not law", cls: "bg-slate-soft text-muted border-line", Icon: FileClock },
  not_applicable: { label: "Does not apply", cls: "bg-slate-soft text-muted border-line", Icon: MinusCircle },
};

export function StatusBadge({ result }: { result: Result }) {
  const s = STATUS[result];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[13px] font-medium ${s.cls}`}>
      <s.Icon aria-hidden size={14} />
      {s.label}
    </span>
  );
}

export function ConflictBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-crimson/30 bg-crimson-soft px-2.5 py-0.5 text-[13px] font-medium text-crimson">
      <TriangleAlert aria-hidden size={14} />
      Conflict — human review
    </span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(36,38,33,0.04)] ${className}`}>{children}</div>;
}

export function Disclaimer({ asOf, snapshot }: { asOf?: string; snapshot?: string }) {
  return (
    <p className="text-[13px] text-muted">
      <strong className="font-semibold text-ink">Legal information, not legal advice.</strong>{" "}
      Covers the supplied corpus only (3 states, 10 cities, 6 rule categories); absence of a rule here is not proof that none exists.
      {asOf && <> Results as of <span className="font-mono">{asOf}</span>.</>}
      {snapshot && <> Snapshot <span className="font-mono">{snapshot}</span>.</>}
    </p>
  );
}

export const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 font-medium transition-colors disabled:opacity-50";
export const btnPrimary = `${btn} bg-teal text-white hover:bg-[#005753]`;
export const btnSecondary = `${btn} border border-line bg-card text-ink hover:bg-bg`;
export const input = "min-h-11 w-full rounded-lg border border-line bg-card px-3 text-ink placeholder:text-muted";

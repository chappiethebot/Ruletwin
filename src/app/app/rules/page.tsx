import { Card, CATEGORY_LABEL, Disclaimer, btnSecondary, input } from "@/components/ui";
import { EvidenceDrawer } from "@/components/evidence-drawer";
import { NoSnapshot } from "@/components/no-snapshot";
import { evidenceFor, getSnapshot } from "@/lib/data";
import { officialStatus } from "@/lib/engine/engine";
import { CATEGORIES } from "@/lib/engine/types";

const STATUS_LABEL = { in_force: "In force", not_yet_effective: "Not yet effective", pending: "Pending", failed: "Failed" };
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function RulesPage(props: PageProps<"/app/rules">) {
  const sp = await props.searchParams;
  const snap = getSnapshot();
  if (!snap) return <NoSnapshot />;
  const q = one(sp.q).trim().toLowerCase().slice(0, 100);
  const cat = one(sp.category), jur = one(sp.jurisdiction), st = one(sp.status);
  const asOf = snap.default_as_of;
  const jurisdictions = [...new Set(snap.rules.map((r) => r.jurisdiction))].sort();
  const rules = snap.rules.filter((r) =>
    (!q || `${r.team_rule_id} ${r.title} ${r.citation} ${r.requirement} ${r.jurisdiction}`.toLowerCase().includes(q)) &&
    (!cat || r.category === cat) && (!jur || r.jurisdiction === jur) && (!st || officialStatus(r, asOf) === st));
  const docs = Object.values(snap.documents);
  const disp = (d: string) => docs.filter((x) => x.disposition.startsWith(d)).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] sm:text-[40px]">Rule library</h1>
        <p className="text-muted">Every rule extracted automatically from the corpus, with its exact source text. Status shown as of <span className="font-mono">{asOf}</span>.</p>
      </div>
      <Card>
        <form method="get" className="grid gap-3 md:grid-cols-[1fr_200px_200px_170px_auto] md:items-end">
          <label className="text-[14px] font-medium">Search<input name="q" defaultValue={one(sp.q)} className={`${input} mt-1`} placeholder="Title, citation, rule id" /></label>
          <label className="text-[14px] font-medium">Category
            <select name="category" defaultValue={cat} className={`${input} mt-1`}><option value="">All</option>{CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select></label>
          <label className="text-[14px] font-medium">Jurisdiction
            <select name="jurisdiction" defaultValue={jur} className={`${input} mt-1`}><option value="">All</option>{jurisdictions.map((j) => <option key={j}>{j}</option>)}</select></label>
          <label className="text-[14px] font-medium">Status
            <select name="status" defaultValue={st} className={`${input} mt-1`}><option value="">All</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <button className={btnSecondary}>Filter</button>
        </form>
      </Card>
      <p role="status" className="text-[14px] text-muted">{rules.length} of {snap.rules.length} rules</p>
      <div className="flex flex-col gap-3">
        {rules.map((r) => (
          <article key={r.team_rule_id} className="rounded-lg border border-line bg-card p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
              <div className="min-w-0 flex-1">
                <h2 className="text-[17px] font-semibold">{r.title}</h2>
                <p className="font-mono text-[13px] text-muted">{r.team_rule_id} · {r.citation} · {r.jurisdiction} · {CATEGORY_LABEL[r.category]}</p>
              </div>
              <span className="rounded-full border border-line px-2.5 py-0.5 text-[13px]">{STATUS_LABEL[officialStatus(r, asOf)]}{r.effective_date ? ` · eff. ${r.effective_date}` : ""}</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[13px] ${r.extraction.review.length ? "border-amber/30 bg-amber-soft text-amber" : "border-line text-muted"}`}>
                {r.extraction.review.length ? `${r.extraction.review.length} review note${r.extraction.review.length > 1 ? "s" : ""}` : "validated, no notes"}
              </span>
            </div>
            <p className="mt-2">{r.requirement}</p>
            {r.key_value && <p className="mt-1 text-[14px]"><span className="text-muted">Key value:</span> {r.key_value}</p>}
            {r.coverage_conditions && <p className="mt-1 text-[14px] text-muted">Coverage: {r.coverage_conditions}</p>}
            {r.conflict_note && <p className="mt-1 text-[14px] text-crimson">Conflict note: {r.conflict_note}</p>}
            <div className="mt-3 flex flex-wrap items-start gap-3">
              <EvidenceDrawer evidence={evidenceFor(snap, r)} title={r.title} />
              <details className="min-w-0 flex-1">
                <summary className="flex min-h-11 cursor-pointer items-center text-[14px] font-medium text-accent">Structured record</summary>
                <pre className="mt-2 max-h-[360px] overflow-auto rounded-lg border border-line bg-bg p-3 font-mono text-[12px]">{JSON.stringify({ ...r, status: officialStatus(r, asOf) }, null, 2)}</pre>
              </details>
            </div>
          </article>
        ))}
      </div>
      <Card>
        <h2 className="text-[17px] font-semibold">Processing coverage</h2>
        <p className="mt-1 text-[14px] text-muted">Every corpus entry has a disposition. This measures processing, not legal completeness.</p>
        <p className="mt-2 text-[14px]">{disp("processed")} processed ({disp("processed_no_rules")} with no in-scope rule) · {disp("reference_only")} link-only (no text supplied) · {disp("error")} errors</p>
        <details className="mt-2">
          <summary className="flex min-h-11 cursor-pointer items-center text-[14px] font-medium text-accent">Document ledger</summary>
          <ul className="mt-2 grid gap-1 font-mono text-[12px] sm:grid-cols-2">
            {docs.map((d) => <li key={d.doc_id}>{d.doc_id}: {d.disposition}{d.accepted ? ` · ${d.accepted} accepted` : ""}{d.rejected.length ? ` · ${d.rejected.length} rejected` : ""}{d.error ? ` · ${d.error}` : ""}</li>)}
          </ul>
        </details>
      </Card>
      <Disclaimer snapshot={snap.id} />
    </div>
  );
}

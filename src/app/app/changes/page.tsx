import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Disclaimer, StatusBadge, btnSecondary, input } from "@/components/ui";
import { NoSnapshot } from "@/components/no-snapshot";
import { getSnapshot, isDate } from "@/lib/data";
import { runChange, type ChangeResult } from "@/lib/engine/changes";

const LIMIT = 150;
// Plain-language names for the supplied change cases (ids stay visible as a label).
const NAME: Record<string, string> = {
  T1: "California pricing law", T2: "Hoboken & Jersey City", T3: "New Jersey FAIR Act",
  T4: "Massachusetts bills", T5: "Massachusetts ballot question",
};

export default async function ChangesPage(props: PageProps<"/app/changes">) {
  const sp = await props.searchParams;
  const snap = getSnapshot();
  if (!snap) return <NoSnapshot />;
  const byRule = new Map(snap.rules.map((r) => [r.team_rule_id, r]));
  const custom = isDate(sp.from) && isDate(sp.to);
  let current: ChangeResult | undefined;
  if (custom) {
    current = runChange({ test_id: "custom", title: `All rules: ${sp.from} → ${sp.to}`, type: "as_of", rule_ids: [],
      as_of_before: sp.from as string, as_of_after: sp.to as string }, snap.rules, snap.properties, snap.rules.map((r) => r.team_rule_id), snap.evidence ?? []);
  } else {
    current = snap.changes.find((c) => c.test_id === sp.test) ?? snap.changes[0];
  }
  const def = current?.affected.filter((a) => a.kind === "definite").length ?? 0;
  const propsById = new Map(snap.properties.map((p) => [p.address_id, p]));
  const stat = "flex flex-col bg-white p-4 sm:p-6";
  const num = "text-[32px] font-semibold leading-none tracking-[-0.03em] sm:text-[44px]";

  return (
    <div className="flex animate-rise flex-col gap-10">
      <div>
        <h1 className="text-[36px] font-semibold tracking-[-0.03em] sm:text-[48px]">Law changes</h1>
        <p className="mt-2 max-w-[62ch] text-[17px] text-muted">See which buildings are affected when a law takes effect, passes or fails.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Change cases">
        {snap.changes.map((c) => {
          const on = !custom && current?.test_id === c.test_id;
          return (
            <Link key={c.test_id} href={`/app/changes?test=${c.test_id}`} role="tab" aria-selected={on} title={`${c.test_id}: ${c.title}`}
              className={`flex min-h-10 items-center rounded-full border px-4 text-[14px] transition-colors ${on ? "border-ink bg-ink text-white" : "border-line text-muted hover:border-ink hover:text-ink"}`}>
              {NAME[c.test_id] ?? c.title}
            </Link>
          );
        })}
      </div>

      {current && (
        <section>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{custom ? "Custom comparison" : `Test case ${current.test_id}`}</p>
          <h2 className="mt-1 text-[24px] font-semibold">{current.title}</h2>
          <p className="mt-1 font-mono text-[14px] text-muted">{current.before_label} → {current.after_label}</p>
          <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line" role="status">
            <p className={stat}><span className={num}>{def}</span><span className="mt-2 text-[13px] text-muted">definitely affected</span></p>
            <p className={stat}><span className={num}>{current.affected.length - def}</span><span className="mt-2 text-[13px] text-muted">possibly affected</span></p>
            <p className={stat}><span className={num}>{current.conflict_flag_address_ids.length}</span><span className="mt-2 text-[13px] text-muted">conflict-flagged</span></p>
          </div>
          {current.matched_rule_ids.length > 0 && current.matched_rule_ids.length <= 6 && (
            <ul className="mt-5 flex flex-col gap-1.5 text-[14px]">
              {current.matched_rule_ids.map((id) => { const r = byRule.get(id)!; return (
                <li key={id}>{r.title} <span className="text-muted">· {r.citation}{r.effective_date ? ` · effective ${r.effective_date}` : ""} · {r.logic.status_kind}</span>{" "}
                  <Link className="text-accent underline underline-offset-4" href={`/app/rules?q=${id}`}>Source</Link></li>
              ); })}
            </ul>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer text-[14px] text-muted underline decoration-line underline-offset-4 hover:text-ink">How this was computed</summary>
            <p className="mt-2 max-w-[75ch] text-[14px] text-muted">{current.notes} Definitely affected = changes on the supplied facts; possibly affected = depends on facts not in the data.</p>
          </details>
        </section>
      )}

      {current && current.affected.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <caption className="sr-only">Affected sample properties</caption>
            <thead className="border-b border-line bg-bg text-[13px] text-muted">
              <tr><th className="px-4 py-2.5 font-medium">Building</th><th className="px-4 py-2.5 font-medium">Impact</th><th className="px-4 py-2.5 font-medium">Before</th><th className="px-4 py-2.5 font-medium">After</th></tr>
            </thead>
            <tbody>
              {current.affected.slice(0, LIMIT).map((a) => {
                const p = propsById.get(a.address_id)!;
                const rows = (list: typeof a.before) => list.length ? list.map((e) => (
                  <div key={e.rule_id} className="flex flex-wrap items-center gap-1.5 py-0.5"><StatusBadge result={e.result} />
                    {list.length > 1 && <span className="text-[12px] text-muted">{byRule.get(e.rule_id)?.citation}</span>}</div>
                )) : <span className="text-muted">—</span>;
                return (
                  <tr key={a.address_id} className="border-b border-line align-top transition-colors last:border-0 hover:bg-bg/60">
                    <td className="px-4 py-3"><Link className="font-medium hover:text-accent" href={`/app/properties/${a.address_id}?asOf=${current!.after_label.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? snap.default_as_of}`}>{p.street_address}</Link>
                      <span className="block text-[12px] text-muted">{p.city ?? "city unresolved"}, {p.state}</span></td>
                    <td className="px-4 py-3 capitalize">{a.kind}</td>
                    <td className="px-4 py-3">{rows(a.before)}</td>
                    <td className="px-4 py-3"><span className="flex items-start gap-2"><ArrowRight aria-hidden size={14} className="mt-1.5 shrink-0 text-muted" /><span>{rows(a.after)}</span></span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {current.affected.length > LIMIT && <p className="px-4 py-3 text-[13px] text-muted">Showing {LIMIT} of {current.affected.length}. Full list in <a className="text-accent underline" href="/api/export/changes.json">changes.json</a>.</p>}
        </div>
      )}
      {current && current.affected.length === 0 && (
        <p className="rounded-2xl bg-bg p-6 text-[15px]">No sample address is affected.{current.mode === "negative" ? " A struck or failed measure never takes effect, so no rent cap applies in Boston or Cambridge." : ""}</p>
      )}

      <details className="border-t border-line pt-3" open={custom}>
        <summary className="flex min-h-11 cursor-pointer items-center justify-between text-[15px] font-semibold">Compare any two dates <span aria-hidden className="text-muted">+</span></summary>
        <form method="get" className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-[14px]">From<input type="date" name="from" defaultValue={isDate(sp.from) ? sp.from : "2025-12-31"} className={`${input} mt-1 w-[170px] font-mono`} /></label>
          <label className="text-[14px]">To<input type="date" name="to" defaultValue={isDate(sp.to) ? sp.to : "2027-07-02"} className={`${input} mt-1 w-[170px] font-mono`} /></label>
          <button className={btnSecondary}>Compare</button>
        </form>
      </details>
      <Disclaimer snapshot={snap.id} />
    </div>
  );
}

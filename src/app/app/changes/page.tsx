import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, Disclaimer, StatusBadge, btnSecondary, input } from "@/components/ui";
import { NoSnapshot } from "@/components/no-snapshot";
import { getSnapshot, isDate } from "@/lib/data";
import { runChange, type ChangeResult } from "@/lib/engine/changes";

const LIMIT = 150;

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

  return (
    <div className="flex animate-rise flex-col gap-10">
      <div>
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] sm:text-[40px]">Law changes</h1>
        <p className="mt-2 max-w-[62ch] text-[17px] text-muted">The same buildings under two states of the law. Pick a case to see which addresses change.</p>
      </div>

      <div className="flex w-fit gap-1 rounded-full border border-line p-1" role="tablist" aria-label="Change cases">
        {snap.changes.map((c) => (
          <Link key={c.test_id} href={`/app/changes?test=${c.test_id}`} role="tab" aria-selected={!custom && current?.test_id === c.test_id}
            title={c.title} className={`flex min-h-10 min-w-12 items-center justify-center rounded-full px-4 text-[14px] font-medium transition-colors ${!custom && current?.test_id === c.test_id ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
            {c.test_id}
          </Link>
        ))}
      </div>

      <details className="border-y border-line py-3" open={custom}>
        <summary className="flex min-h-11 cursor-pointer items-center justify-between text-[15px] font-semibold">Compare any two dates <span aria-hidden className="text-muted">+</span></summary>
        <form method="get" className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-[14px]">From<input type="date" name="from" defaultValue={isDate(sp.from) ? sp.from : "2025-12-31"} className={`${input} mt-1 w-[170px] font-mono`} /></label>
          <label className="text-[14px]">To<input type="date" name="to" defaultValue={isDate(sp.to) ? sp.to : "2027-07-02"} className={`${input} mt-1 w-[170px] font-mono`} /></label>
          <button className={btnSecondary}>Compare</button>
        </form>
      </details>

      {current && (
        <section>
          <h2 className="text-[24px] font-semibold">{current.test_id} · {current.title}</h2>
          <p className="mt-1 font-mono text-[13px] text-muted">{current.before_label} → {current.after_label}</p>
          <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line" role="status">
            <p className="flex flex-col bg-white p-4 sm:p-6"><span className="text-[32px] font-semibold leading-none tracking-[-0.03em] sm:text-[44px]">{def}</span> <span className="mt-2 text-[13px] text-muted">definitely affected</span></p>
            <p className="flex flex-col bg-white p-4 sm:p-6"><span className="text-[32px] font-semibold leading-none tracking-[-0.03em] sm:text-[44px]">{current.affected.length - def}</span> <span className="mt-2 text-[13px] text-muted">possibly affected</span></p>
            <p className="flex flex-col bg-white p-4 sm:p-6"><span className="text-[32px] font-semibold leading-none tracking-[-0.03em] sm:text-[44px]">{current.conflict_flag_address_ids.length}</span> <span className="mt-2 text-[13px] text-muted">conflict-flagged</span></p>
          </div>
          <p className="mt-4 max-w-[75ch] text-[14px] text-muted">{current.notes}</p>
          {current.matched_rule_ids.length > 0 && current.matched_rule_ids.length <= 6 && (
            <ul className="mt-3 flex flex-col gap-1 text-[14px]">
              {current.matched_rule_ids.map((id) => { const r = byRule.get(id)!; return (
                <li key={id}><span className="font-mono">{id}</span> — {r.title} ({r.citation}; {r.logic.status_kind}{r.effective_date ? `, effective ${r.effective_date}` : ""}) <Link className="text-accent underline" href={`/app/rules?q=${id}`}>evidence</Link></li>
              ); })}
            </ul>
          )}
        </section>
      )}

      {current && current.affected.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <caption className="sr-only">Affected sample properties</caption>
            <thead className="border-b border-line bg-bg text-[13px] text-muted">
              <tr><th className="px-4 py-2 font-medium">Property</th><th className="px-4 py-2 font-medium">Impact</th><th className="px-4 py-2 font-medium">Before</th><th className="px-4 py-2 font-medium">After</th></tr>
            </thead>
            <tbody>
              {current.affected.slice(0, LIMIT).map((a) => {
                const p = propsById.get(a.address_id)!;
                const rows = (list: typeof a.before) => list.length ? list.map((e) => (
                  <div key={e.rule_id} className="flex flex-wrap items-center gap-1.5 py-0.5"><span className="font-mono text-[12px]">{e.rule_id}</span><StatusBadge result={e.result} /></div>
                )) : <span className="text-muted">—</span>;
                return (
                  <tr key={a.address_id} className="border-b border-line align-top last:border-0">
                    <td className="px-4 py-2"><Link className="text-accent underline" href={`/app/properties/${a.address_id}?asOf=${current!.after_label.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? snap.default_as_of}`}>{p.street_address}</Link>
                      <span className="block text-[12px] text-muted">{p.address_id} · {p.city ?? "city unresolved"}, {p.state}</span></td>
                    <td className="px-4 py-2">{a.kind}</td>
                    <td className="px-4 py-2">{rows(a.before)}</td>
                    <td className="px-4 py-2"><ArrowRight aria-hidden size={14} className="mb-1 text-muted" />{rows(a.after)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {current.affected.length > LIMIT && <p className="px-4 py-3 text-[13px] text-muted">Showing {LIMIT} of {current.affected.length}. Full list in <a className="text-accent underline" href="/api/export/changes.json">changes.json</a>.</p>}
        </div>
      )}
      {current && current.affected.length === 0 && (
        <Card><p>No sample address is affected.{current.mode === "negative" ? " A struck or failed measure never takes effect." : ""}</p></Card>
      )}
      <Disclaimer snapshot={snap.id} />
    </div>
  );
}

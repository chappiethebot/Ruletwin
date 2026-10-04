import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, BookmarkCheck, GitBranch, Save, TriangleAlert } from "lucide-react";
import { Card, CATEGORY_LABEL, Disclaimer, StatusBadge, btnPrimary, btnSecondary, input } from "@/components/ui";
import { RuleCard } from "@/components/rule-card";
import { RenterSummary } from "@/components/renter-summary";
import { NoSnapshot } from "@/components/no-snapshot";
import { auditRows, evidenceFor, getSnapshot, isDate, resolveFor } from "@/lib/data";
import { describeFact } from "@/lib/engine/engine";
import { CATEGORIES, type Field, type Result } from "@/lib/engine/types";
import { currentUser, getDb } from "@/lib/auth";
import { isSaved } from "@/lib/db";
import { saveReportAction, toggleSaveProperty } from "@/lib/actions";

const ORDER: Result[] = ["applies", "unknown", "superseded", "not_yet_effective", "pending"];
const FACT_LABEL: Partial<Record<Field, string>> = {
  year_built: "Year built", units: "Units", co_date: "Certificate of occupancy", property_type: "Property type",
  owner_type: "Owner type", owner_occupied: "Owner-occupied", owner_portfolio_units: "Owner portfolio",
  affordable_restricted: "Deed-restricted / subsidized",
};
const KIND_LABEL = {
  missing_property_data: "Missing property data",
  uncertain_property_identity: "Uncertain property identity",
  missing_legal_version: "Missing legal version",
  disputed_legal_interpretation: "Disputed legal interpretation",
};

// Answers arrive as repeated ?ans=<variable id>=<option label>.
function parseAnswers(v: string | string[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of (Array.isArray(v) ? v : v ? [v] : []).slice(0, 20)) {
    const i = a.indexOf("=");
    if (i > 0) out[a.slice(0, i)] = a.slice(i + 1);
  }
  return out;
}

export default async function PropertyPage(props: PageProps<"/app/properties/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const snap = getSnapshot();
  if (!snap) return <NoSnapshot />;
  const asOf = isDate(sp.asOf) ? sp.asOf : snap.default_as_of;
  const answers = parseAnswers(sp.ans);
  const lang = sp.lang === "es" ? "es" as const : "en" as const;
  const r = resolveFor(snap, id, asOf, answers);
  if (!r) notFound();
  const { property: p, resolution } = r;
  const shown = resolution.evaluations.filter((e) => e.result !== "not_applicable");
  const byRule = new Map(snap.rules.map((x) => [x.team_rule_id, x]));
  const counts = Object.fromEntries(ORDER.map((k) => [k, shown.filter((e) => e.result === k).length]));
  const labels = Object.fromEntries(resolution.blocking.map((b) => [b.id, b.label]));
  const user = await currentUser();
  const saved = user ? isSaved(getDb(), user.id, p.address_id) : false;
  const base = `/app/properties/${p.address_id}`;
  const keep = Object.entries(answers).map(([k, v]) => ["ans", `${k}=${v}`]);
  const ruleTitle = (rid: string) => byRule.get(rid)?.title ?? rid;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[min(100%,22rem)] flex-1">
          <p className="text-[13px] text-muted"><Link href="/app/check" className="text-teal underline">Check address</Link> / {p.address_id}</p>
          <h1 className="text-[24px] font-semibold tracking-tight sm:text-[28px]">{p.street_address}, {p.postal_city}, {p.state} {p.zip}</h1>
          <p className="text-muted">
            Jurisdiction: {p.state}{p.county ? ` › ${p.county}` : ""} › {p.city ?? (p.city_candidates ? `one of ${p.city_candidates.join(" / ")}` : "city unresolved")} · as of <span className="font-mono">{asOf}</span>
          </p>
        </div>
        <form method="get" className="flex items-end gap-2">
          {keep.map(([k, v], i) => <input key={i} type="hidden" name={k} value={v} />)}
          <label className="text-[14px] font-medium">As of
            <input type="date" name="asOf" defaultValue={asOf} className={`${input} mt-1 w-[170px] font-mono`} />
          </label>
          <button className={btnSecondary}>Update</button>
        </form>
      </div>

      <RenterSummary evaluations={shown} rules={byRule} asOf={asOf} lang={lang} labels={labels}
        switchHref={`${base}?${new URLSearchParams([["asOf", asOf], ...keep, ...(lang === "en" ? [["lang", "es"]] : [])]).toString()}`} />

      {r.answers.length > 0 && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg border border-violet/30 bg-violet-soft p-3 text-[14px] text-violet">
          <span><strong>Hypothetical:</strong> showing results with your answers — {r.answers.map((a) => `${a.label}: ${a.answer}`).join("; ")}. Not saved, not official.</span>
          <Link href={`${base}?asOf=${asOf}`} className="font-medium underline">Reset answers</Link>
        </div>
      )}
      {r.inconsistent && (
        <p role="alert" className="rounded-lg bg-crimson-soft p-3 text-[14px] text-crimson">Those answers contradict the property facts (e.g. a certificate date before construction); they were not applied.</p>
      )}

      <div role="status" className="flex flex-wrap gap-2">
        {ORDER.map((k) => (
          <span key={k} className="inline-flex items-center gap-2">
            {k === "unknown"
              ? <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber-soft px-2.5 py-0.5 text-[13px] font-medium text-amber"><GitBranch aria-hidden size={14} />Conditional</span>
              : <StatusBadge result={k} />}
            <span className="font-mono text-[14px]">{counts[k]}</span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-8">
          {CATEGORIES.map((cat) => {
            const items = shown.filter((e) => byRule.get(e.rule_id)!.category === cat)
              .sort((a, b) => ORDER.indexOf(a.result) - ORDER.indexOf(b.result));
            return (
              <section key={cat} aria-labelledby={`c-${cat}`}>
                <h2 id={`c-${cat}`} className="mb-3 text-[19px] font-semibold">{CATEGORY_LABEL[cat]}</h2>
                {items.length ? (
                  <div className="flex flex-col gap-3">
                    {items.map((e) => { const rule = byRule.get(e.rule_id)!; return <RuleCard key={e.rule_id} rule={rule} ev={e} evidence={evidenceFor(snap, rule)} labels={labels} />; })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-line p-4 text-[14px] text-muted">
                    No rule in the supplied corpus covers this address in this category on this date. This is not proof that no rule exists.
                  </p>
                )}
              </section>
            );
          })}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <h2 className="mb-1 text-[16px] font-semibold">What would settle the open answers</h2>
            {resolution.questions.length ? (
              <>
                <p className="mb-3 text-[13px] text-muted">Only facts that change a result are asked, most decisive first. Answers are a private hypothetical.</p>
                <ol className="flex flex-col gap-4">
                  {resolution.questions.slice(0, 6).map((q) => (
                    <li key={q.id} className="text-[14px]">
                      <p className="text-[12px] uppercase tracking-wide text-muted">{KIND_LABEL[q.kind]} · decides {q.decisive_for.length}</p>
                      <p className="font-medium">{q.question}</p>
                      <p className="text-[13px] text-muted">Affects: {[...new Set(q.decisive_for.map(ruleTitle))].join("; ")}</p>
                      {q.evidence_hint && <p className="text-[13px] text-muted">Where to find it: {q.evidence_hint}</p>}
                      <form method="get" className="mt-2 flex gap-2">
                        <input type="hidden" name="asOf" value={asOf} />
                        {keep.map(([k, v], i) => <input key={i} type="hidden" name={k} value={v} />)}
                        <label className="sr-only" htmlFor={`q-${q.id}`}>{q.question}</label>
                        <select id={`q-${q.id}`} name="ans" className={`${input} min-w-0 flex-1`} defaultValue="">
                          <option value="" disabled>Choose…</option>
                          {q.options.map((o) => <option key={o} value={`${q.id}=${o}`}>{o}</option>)}
                        </select>
                        <button className={btnSecondary}>Apply</button>
                      </form>
                    </li>
                  ))}
                </ol>
              </>
            ) : <p className="text-[14px] text-muted">No missing fact changes any result on this date.</p>}
            {resolution.blocking.some((b) => b.kind === "disputed_legal_interpretation") && (
              <p className="mt-3 flex gap-2 text-[13px] text-crimson"><TriangleAlert aria-hidden size={15} className="mt-0.5 shrink-0" />
                Human legal review needed: {resolution.blocking.filter((b) => b.kind === "disputed_legal_interpretation").map((b) => b.label).join("; ")}.</p>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-[16px] font-semibold">Property facts</h2>
            <dl className="flex flex-col gap-2 text-[14px]">
              <div><dt className="text-muted">County</dt><dd>{p.county ?? "not established (no validated geocode)"}</dd></div>
              <div><dt className="text-muted">Legal city</dt><dd>{p.city ?? (p.city_candidates ? `ambiguous: ${p.city_candidates.join(" / ")}` : "unresolved")}<span className="block text-[12px] text-muted">{p.city_evidence}</span></dd></div>
              {(Object.keys(FACT_LABEL) as Field[]).map((f) => (
                <div key={f}><dt className="text-muted">{FACT_LABEL[f]}</dt><dd className="break-words">{describeFact(p.facts[f])}</dd></div>
              ))}
              <div><dt className="text-muted">Assessor use</dt><dd>{p.raw.use_code} {p.raw.use_description}</dd></div>
            </dl>
          </Card>

          <Card>
            <h2 className="mb-2 text-[16px] font-semibold">Evidence retrieved</h2>
            {r.evidence.records.length ? (
              <ul className="flex flex-col gap-3 text-[13px]">
                {r.evidence.records.map((e) => (
                  <li key={e.id}>
                    <p><span className="font-mono">{e.id}</span> · {e.source.adapter} · <strong>{e.status}</strong>{r.evidence.used.includes(e.id) ? " · used" : ""}</p>
                    <p>{e.field}: {e.value === null ? "nothing found" : JSON.stringify(e.value)}</p>
                    {e.reasons.length > 0 && <p className="text-muted">{e.reasons.join("; ")}</p>}
                    <details><summary className="cursor-pointer text-teal">Exact source span</summary>
                      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-bg p-2 font-mono text-[11px]">{e.source.span}</pre>
                      <a className="break-all text-teal underline" href={e.source.url} target="_blank" rel="noopener noreferrer">source</a> · retrieved <span className="font-mono">{e.source.retrieved_at.slice(0, 16)}</span>
                    </details>
                  </li>
                ))}
              </ul>
            ) : <p className="text-[13px] text-muted">No external evidence was needed or available for this property.</p>}
            {r.evidence.conflicts.length > 0 && <p className="mt-2 text-[13px] text-crimson">Conflicting sources (field left open): {r.evidence.conflicts.join("; ")}</p>}
          </Card>

          <Card>
            <h2 className="mb-3 text-[16px] font-semibold">Save</h2>
            {user ? (
              <div className="flex flex-col gap-2">
                <form action={toggleSaveProperty}>
                  <input type="hidden" name="property_id" value={p.address_id} />
                  <button className={`${btnSecondary} w-full`}>
                    {saved ? <><BookmarkCheck aria-hidden size={16} /> Saved — remove</> : <><Bookmark aria-hidden size={16} /> Save property</>}
                  </button>
                </form>
                <form action={saveReportAction}>
                  <input type="hidden" name="property_id" value={p.address_id} />
                  <input type="hidden" name="as_of" value={asOf} />
                  <button className={`${btnPrimary} w-full`}><Save aria-hidden size={16} /> Save report for {asOf}</button>
                </form>
                <p className="text-[12px] text-muted">Reports use official facts and evidence only (no hypothetical answers) and are pinned to snapshot {snap.id}.</p>
              </div>
            ) : (
              <Link href={`/login?next=${encodeURIComponent(`${base}?asOf=${asOf}`)}`} className={`${btnPrimary} w-full`}>
                Sign in to save
              </Link>
            )}
          </Card>
        </aside>
      </div>
      <section aria-labelledby="audit-view" className="rounded-xl border border-line bg-card">
        <details>
          <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-3 px-5 py-3">
            <h2 id="audit-view" className="text-[17px] font-semibold">Audit view</h2>
            <span className="text-[13px] text-muted">source, retrieval date, as-of date and reasoning boundary for every answer</span>
          </summary>
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <caption className="sr-only">Audit trail for each answer</caption>
              <thead className="bg-bg text-muted">
                <tr>{["Rule", "Result", "Source", "Retrieved", "As of", "Reasoning boundary", "Confidence"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {auditRows(snap, r.answers.length ? resolveFor(snap, id, asOf)! : r, asOf).map((a) => (
                  <tr key={a.rule_id} className="border-t border-line align-top">
                    <td className="px-3 py-2"><span className="font-mono">{a.rule_id}</span><span className="block">{a.citation}</span></td>
                    <td className="px-3 py-2">{a.result}</td>
                    <td className="px-3 py-2"><span className="font-mono">{a.source_doc_id}</span>{a.in_supplied_corpus ? "" : <span className="block text-crimson">not supplied corpus text</span>}</td>
                    <td className="px-3 py-2 font-mono">{(a.retrieved_at ?? "unknown").slice(0, 10)}</td>
                    <td className="px-3 py-2 font-mono">{a.as_of}</td>
                    <td className="px-3 py-2">{a.reasoning_boundary}{a.presumptions.length ? <span className="block text-muted">presumes: {a.presumptions.join("; ")}</span> : null}</td>
                    <td className="px-3 py-2">{a.confidence ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-3 text-[13px]"><a className="text-teal underline" href={`/api/audit/${p.address_id}?asOf=${asOf}`}>Download audit trail (JSON)</a> · snapshot <span className="font-mono">{snap.id}</span> · official facts only (no hypothetical answers)</p>
        </details>
      </section>
      <Disclaimer asOf={asOf} snapshot={snap.id} />
    </div>
  );
}

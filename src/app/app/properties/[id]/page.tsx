import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Save, TriangleAlert } from "lucide-react";
import { CATEGORY_LABEL, Disclaimer, btnPrimary, btnSecondary } from "@/components/ui";
import { RuleCard } from "@/components/rule-card";
import { RenterSummary } from "@/components/renter-summary";
import { NoSnapshot } from "@/components/no-snapshot";
import { auditRows, evidenceFor, getSnapshot, isDate, resolveFor } from "@/lib/data";
import { describeFact } from "@/lib/engine/engine";
import { CATEGORIES, type Field, type Result } from "@/lib/engine/types";
import { HOSTED_DEMO, currentUser, getDb } from "@/lib/auth";
import { isSaved } from "@/lib/db";
import { saveReportAction, toggleSaveProperty } from "@/lib/actions";

const ORDER: Result[] = ["applies", "unknown", "superseded", "not_yet_effective", "pending"];
const COUNT_LABEL: Record<string, string> = {
  applies: "apply", unknown: "depend on missing facts", superseded: "superseded by local law", not_yet_effective: "not yet in effect", pending: "pending",
};
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
const label = "text-[12px] font-medium uppercase tracking-[0.08em] text-muted";
const summary = "flex min-h-11 cursor-pointer items-center justify-between gap-3 text-[15px] font-semibold";

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
  const counts = ORDER.map((k) => [k, shown.filter((e) => e.result === k).length] as const).filter(([, n]) => n > 0);
  const labels = Object.fromEntries(resolution.blocking.map((b) => [b.id, b.label]));
  const user = await currentUser();
  const saved = user ? isSaved(getDb(), user.id, p.address_id) : false;
  const base = `/app/properties/${p.address_id}`;
  const keep = Object.entries(answers).map(([k, v]) => ["ans", `${k}=${v}`]);
  const ruleTitle = (rid: string) => byRule.get(rid)?.title ?? rid;
  const byCat = CATEGORIES.map((cat) => [cat, shown.filter((e) => byRule.get(e.rule_id)!.category === cat)
    .sort((a, b) => ORDER.indexOf(a.result) - ORDER.indexOf(b.result))] as const);
  const empty = byCat.filter(([, items]) => !items.length).map(([cat]) => CATEGORY_LABEL[cat]);
  const reviews = resolution.blocking.filter((b) => b.kind === "disputed_legal_interpretation");

  return (
    <div className="flex animate-rise flex-col gap-12">
      <header className="flex flex-wrap items-end gap-6">
        <div className="min-w-[min(100%,22rem)] flex-1">
          <Link href="/app/check" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
            <ArrowLeft aria-hidden size={14} /> All addresses
          </Link>
          <h1 className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">{p.street_address}, {p.postal_city}</h1>
          <p className="mt-2 text-muted">
            {p.state}{p.county ? ` › ${p.county}` : ""} › {p.city ?? (p.city_candidates ? `one of ${p.city_candidates.join(" / ")}` : "city unresolved")}
            <span aria-hidden className="mx-2 text-line">|</span><span className="font-mono">{p.address_id}</span>
          </p>
        </div>
        <form method="get" className="flex items-center gap-2 text-[14px]">
          {keep.map(([k, v], i) => <input key={i} type="hidden" name={k} value={v} />)}
          <label htmlFor="asof-p" className="text-muted">As of</label>
          <input id="asof-p" type="date" name="asOf" defaultValue={asOf} className="h-10 rounded-full border border-line px-3 font-mono transition-colors hover:border-ink" />
          <button className={`${btnSecondary} min-h-10`}>Update</button>
        </form>
      </header>

      {r.answers.length > 0 && (
        <div role="status" className="-mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-violet-soft px-5 py-3 text-[14px] text-violet">
          <span><strong>Hypothetical:</strong> showing results with your answers — {r.answers.map((a) => `${a.label}: ${a.answer}`).join("; ")}. Not saved, not official.</span>
          <Link href={`${base}?asOf=${asOf}`} className="font-medium underline underline-offset-4">Reset</Link>
        </div>
      )}
      {r.inconsistent && (
        <p role="alert" className="-mt-6 rounded-2xl bg-crimson-soft px-5 py-3 text-[14px] text-crimson">Those answers contradict the property facts (e.g. a certificate date before construction); they were not applied.</p>
      )}

      <RenterSummary evaluations={shown} rules={byRule} asOf={asOf} lang={lang} labels={labels}
        switchHref={`${base}?${new URLSearchParams([["asOf", asOf], ...keep, ...(lang === "en" ? [["lang", "es"]] : [])]).toString()}`} />

      <section aria-labelledby="details" className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-10">
          <div>
            <h2 id="details" className="text-[24px] font-semibold">Every rule, with its source</h2>
            <p role="status" className="mt-1 text-[14px] text-muted">{counts.map(([k, n]) => `${n} ${COUNT_LABEL[k]}`).join(" · ") || "No rule in the supplied corpus covers this address on this date."}</p>
          </div>
          {byCat.filter(([, items]) => items.length).map(([cat, items]) => (
            <section key={cat} aria-labelledby={`c-${cat}`}>
              <h3 id={`c-${cat}`} className={`mb-3 ${label}`}>{CATEGORY_LABEL[cat]}</h3>
              <div className="flex flex-col gap-3">
                {items.map((e) => { const rule = byRule.get(e.rule_id)!; return <RuleCard key={e.rule_id} rule={rule} ev={e} evidence={evidenceFor(snap, rule)} labels={labels} />; })}
              </div>
            </section>
          ))}
          {empty.length > 0 && (
            <p className="text-[14px] text-muted">No rule in the supplied corpus for {empty.join(", ").toLowerCase()} at this address. That is not proof none exists.</p>
          )}
        </div>

        <aside className="flex flex-col divide-y divide-line border-t border-line lg:sticky lg:top-24 lg:self-start">
          {(resolution.questions.length > 0 || reviews.length > 0) && (
            <div className="py-5">
              <h2 className="text-[15px] font-semibold">What would settle the open answers</h2>
              {resolution.questions.length > 0 && (
                <ol className="mt-3 flex flex-col gap-5">
                  {resolution.questions.slice(0, 4).map((q) => (
                    <li key={q.id} className="text-[14px]">
                      <p className={label}>{KIND_LABEL[q.kind]}</p>
                      <p className="mt-1 font-medium">{q.question}</p>
                      <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">Affects {[...new Set(q.decisive_for.map(ruleTitle))].join("; ")}</p>
                      {q.options.length > 0 && (
                        <form method="get" className="mt-2 flex gap-2">
                          <input type="hidden" name="asOf" value={asOf} />
                          {keep.map(([k, v], i) => <input key={i} type="hidden" name={k} value={v} />)}
                          <label className="sr-only" htmlFor={`q-${q.id}`}>{q.question}</label>
                          <select id={`q-${q.id}`} name="ans" className="h-10 min-w-0 flex-1 rounded-full border border-line bg-white px-3" defaultValue="">
                            <option value="" disabled>Choose…</option>
                            {q.options.map((o) => <option key={o} value={`${q.id}=${o}`}>{o}</option>)}
                          </select>
                          <button className={`${btnSecondary} min-h-10`}>Apply</button>
                        </form>
                      )}
                    </li>
                  ))}
                </ol>
              )}
              {reviews.length > 0 && (
                <p className="mt-4 flex gap-2 text-[13px] text-crimson"><TriangleAlert aria-hidden size={15} className="mt-0.5 shrink-0" />
                  Human legal review needed: {reviews.map((b) => b.label).join("; ")}.</p>
              )}
            </div>
          )}

          <details className="py-4">
            <summary className={summary}>Building facts <span aria-hidden className="text-muted">+</span></summary>
            <dl className="mt-3 flex flex-col gap-2.5 text-[14px]">
              <div><dt className="text-muted">Legal city</dt><dd>{p.city ?? (p.city_candidates ? `ambiguous: ${p.city_candidates.join(" / ")}` : "unresolved")}<span className="block text-[12px] text-muted">{p.city_evidence}</span></dd></div>
              <div><dt className="text-muted">County</dt><dd>{p.county ?? "not established"}</dd></div>
              {(Object.keys(FACT_LABEL) as Field[]).map((f) => (
                <div key={f}><dt className="text-muted">{FACT_LABEL[f]}</dt><dd className="break-words">{describeFact(p.facts[f])}</dd></div>
              ))}
              <div><dt className="text-muted">Assessor use</dt><dd>{p.raw.use_code} {p.raw.use_description}</dd></div>
            </dl>
          </details>

          <details className="py-4">
            <summary className={summary}>Public records consulted <span aria-hidden className="text-muted">+</span></summary>
            {r.evidence.records.length ? (
              <ul className="mt-3 flex flex-col gap-3 text-[13px]">
                {r.evidence.records.map((e) => (
                  <li key={e.id}>
                    <p><span className="font-mono">{e.id}</span> · {e.source.adapter} · <strong>{e.status}</strong>{r.evidence.used.includes(e.id) ? " · used" : ""}</p>
                    <p>{e.field}: {e.value === null ? "nothing found" : JSON.stringify(e.value)}</p>
                    {e.reasons.length > 0 && <p className="text-muted">{e.reasons.join("; ")}</p>}
                    <details><summary className="cursor-pointer text-accent">Exact source span</summary>
                      <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-bg p-2 font-mono text-[11px]">{e.source.span}</pre>
                      <a className="break-all text-accent underline" href={e.source.url} target="_blank" rel="noopener noreferrer">source</a> · retrieved <span className="font-mono">{e.source.retrieved_at.slice(0, 16)}</span>
                    </details>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-[13px] text-muted">No external records were needed for this building.</p>}
            {r.evidence.conflicts.length > 0 && <p className="mt-2 text-[13px] text-crimson">Conflicting sources (field left open): {r.evidence.conflicts.join("; ")}</p>}
          </details>

          {!HOSTED_DEMO && (
            <div className="flex flex-col gap-2 py-5">
              {user ? (
                <>
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
                  <p className="text-[12px] text-muted">Reports use official facts only and are pinned to snapshot {snap.id}.</p>
                </>
              ) : (
                <Link href={`/login?next=${encodeURIComponent(`${base}?asOf=${asOf}`)}`} className={`${btnSecondary} w-full`}>Sign in to save</Link>
              )}
            </div>
          )}
        </aside>
      </section>

      <details className="border-t border-line pt-4">
        <summary className={summary}>
          <span>Audit view <span className="ml-2 text-[13px] font-normal text-muted">source, retrieval date, as-of date and reasoning boundary per answer</span></span>
          <span aria-hidden className="text-muted">+</span>
        </summary>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
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
                  <td className="px-3 py-2"><span className="font-mono">{a.source_doc_id}</span>{a.in_supplied_corpus ? "" : <span className="block text-crimson">{a.corpus_reason}</span>}</td>
                  <td className="px-3 py-2 font-mono">{(a.retrieved_at ?? "unknown").slice(0, 10)}</td>
                  <td className="px-3 py-2 font-mono">{a.as_of}</td>
                  <td className="px-3 py-2">{a.reasoning_boundary}{a.presumptions.length ? <span className="block text-muted">presumes: {a.presumptions.join("; ")}</span> : null}</td>
                  <td className="px-3 py-2">{a.confidence ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-muted"><a className="text-accent underline underline-offset-4" href={`/api/audit/${p.address_id}?asOf=${asOf}`}>Download audit trail (JSON)</a> · snapshot <span className="font-mono">{snap.id}</span> · official facts only</p>
      </details>
      <Disclaimer asOf={asOf} snapshot={snap.id} />
    </div>
  );
}

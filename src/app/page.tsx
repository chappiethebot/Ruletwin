import Link from "next/link";
import { ArrowRight, FileSearch, GitCompareArrows, HelpCircle, Scale } from "lucide-react";
import { Card, Disclaimer, btnPrimary, btnSecondary } from "@/components/ui";
import { getSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic"; // coverage numbers follow the active snapshot

export default function Home() {
  const snap = getSnapshot();
  const cities = snap ? new Set(snap.properties.map((p) => p.city).filter(Boolean)).size : 0;
  const docs = snap ? Object.values(snap.documents).filter((d) => d.disposition.startsWith("processed")).length : 0;
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-12 px-4 py-8 lg:px-8">
      <header className="flex items-center gap-3">
        <span className="flex items-center gap-2 text-[17px] font-semibold"><Scale aria-hidden size={22} className="text-teal" /> RuleTwin</span>
        <Link href="/login" className="ml-auto flex min-h-11 items-center px-3 text-[14px] font-medium text-teal">Sign in</Link>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="flex flex-col gap-5">
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight">Which rental housing rules apply at this address — today, and after the next change?</h1>
          <p className="text-[17px] text-muted">
            Pick an apartment building and a date. RuleTwin resolves its legal city, tests each rule’s coverage against the building’s facts,
            and shows every answer with the exact source text. When the data can’t decide, it says “unknown” and names the missing fact.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/app/check" className={btnPrimary}>Explore sample properties <ArrowRight aria-hidden size={16} /></Link>
            <Link href="/app/changes" className={btnSecondary}>See law changes</Link>
          </div>
        </div>
        <Card>
          <h2 className="text-[15px] font-semibold">Current coverage</h2>
          {snap ? (
            <dl className="mt-3 grid grid-cols-2 gap-4">
              <div><dt className="text-[13px] text-muted">Rules extracted</dt><dd className="text-[24px] font-semibold">{snap.rule_count}</dd></div>
              <div><dt className="text-[13px] text-muted">Sample properties</dt><dd className="text-[24px] font-semibold">{snap.property_count}</dd></div>
              <div><dt className="text-[13px] text-muted">Source documents read</dt><dd className="text-[24px] font-semibold">{docs}</dd></div>
              <div><dt className="text-[13px] text-muted">Legal cities resolved</dt><dd className="text-[24px] font-semibold">{cities}</dd></div>
            </dl>
          ) : <p className="mt-2 text-muted">No snapshot published yet.</p>}
          <p className="mt-4 text-[13px] text-muted">California, New Jersey and Massachusetts; six rule categories. Snapshot <span className="font-mono">{snap?.id ?? "—"}</span>.</p>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { Icon: FileSearch, t: "Every answer is cited", d: "Each rule links to the exact sentence in the statute or ordinance, its URL and retrieval date." },
          { Icon: HelpCircle, t: "Unknown when it should be", d: "Year built is not a certificate-of-occupancy date, and owner type is not in the data. Those cases say unknown and list the fact that would decide." },
          { Icon: GitCompareArrows, t: "Changes by address", d: "Compare two dates or a pending bill and see which buildings are definitely or possibly affected, and why." },
        ].map(({ Icon, t, d }) => (
          <Card key={t}><Icon aria-hidden size={20} className="text-teal" /><h2 className="mt-2 text-[16px] font-semibold">{t}</h2><p className="mt-1 text-[14px] text-muted">{d}</p></Card>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[20px] font-semibold">How it works</h2>
        <ol className="grid gap-3 text-[15px] md:grid-cols-2">
          <li><strong>1. Extract.</strong> A language model reads every corpus document and proposes rule records; each quote is verified character-for-character against the source, or the record is rejected.</li>
          <li><strong>2. Resolve.</strong> Each address is geocoded with the US Census Geocoder to its incorporated place. Postal city names are not trusted as legal cities.</li>
          <li><strong>3. Apply.</strong> A deterministic evaluator tests coverage conditions with three-valued logic (true / false / unknown), effective dates and local-versus-state precedence.</li>
          <li><strong>4. Explain.</strong> Answers are generated from the evaluation trace, not by asking a model again, so the explanation always matches the result.</li>
        </ol>
        <p className="text-[14px] text-muted">
          Official exports: <a className="text-teal underline" href="/api/export/rules.json">rules.json</a> ·{" "}
          <a className="text-teal underline" href="/api/export/lookups.json">lookups.json</a> ·{" "}
          <a className="text-teal underline" href="/api/export/changes.json">changes.json</a>
        </p>
      </section>
      <Disclaimer />
    </div>
  );
}

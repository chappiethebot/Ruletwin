import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AddressSearch } from "@/components/address-search";
import { Disclaimer } from "@/components/ui";
import { getSnapshot, propertyOptions } from "@/lib/data";

export const dynamic = "force-dynamic"; // coverage numbers follow the active snapshot

const EXAMPLES = [
  { id: "A0016", label: "3515 Fillmore St, San Francisco", note: "Local rent law overrides state cap" },
  { id: "A0005", label: "1609 Addison St, Berkeley", note: "Missing facts, answered step by step" },
  { id: "A0002", label: "1031 Clinton St, Hoboken", note: "Algorithmic pricing ban" },
  { id: "A0006", label: "69 Westland Ave, Boston", note: "Pending state bills" },
];

const STEPS = [
  { t: "Extract", d: "A language model reads each corpus document. Every quoted sentence must match the source character for character, or the rule is rejected." },
  { t: "Locate", d: "Each address is geocoded to its legal city with the US Census Geocoder. Postal city names are never trusted." },
  { t: "Apply", d: "A deterministic engine tests coverage, dates and local-versus-state precedence with true / false / unknown logic." },
  { t: "Explain", d: "Answers come from the evaluation trace, with the exact source sentence, retrieval date and the one fact that would settle an unknown." },
];

export default function Home() {
  const snap = getSnapshot();
  const cities = snap ? new Set(snap.properties.map((p) => p.city).filter(Boolean)).size : 0;
  const docs = snap ? Object.values(snap.documents).filter((d) => d.disposition.startsWith("processed")).length : 0;
  const asOf = snap?.default_as_of ?? "2026-10-01";
  return (
    <main>
      <section className="mx-auto max-w-[1180px] px-4 pb-16 pt-14 lg:px-8 lg:pb-24 lg:pt-24">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-[13px] text-muted">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" /> California · New Jersey · Massachusetts
        </p>
        <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[64px] lg:text-[80px]">
          Rental law, <span className="text-accent">by address.</span>
        </h1>
        <p className="mt-6 max-w-[56ch] text-[17px] text-muted sm:text-[19px]">
          Pick a building and a date. See which rental housing rules apply, with the exact source sentence behind every answer,
          and the one missing fact when the data can’t decide.
        </p>

        {snap ? (
          <div className="mt-10 max-w-[880px] rounded-lg border border-line p-5 sm:p-6">
            <AddressSearch options={propertyOptions(snap)} defaultDate={asOf} />
            <div className="mt-5 border-t border-line pt-4">
              <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Or try an example</p>
              <ul className="grid gap-x-6 sm:grid-cols-2">
                {EXAMPLES.map((e) => (
                  <li key={e.id}>
                    <Link href={`/app/properties/${e.id}?asOf=${asOf}`} className="group flex min-h-11 items-center gap-2 border-b border-line py-2 text-[14px]">
                      <span className="min-w-0 flex-1"><span className="font-medium group-hover:text-accent">{e.label}</span>
                        <span className="block text-[13px] text-muted">{e.note}</span></span>
                      <ArrowUpRight aria-hidden size={16} className="shrink-0 text-muted group-hover:text-accent" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : <p className="mt-10 text-muted">No snapshot published yet.</p>}
      </section>

      {snap && (
        <section aria-label="Coverage" className="border-y border-line">
          <dl className="mx-auto grid max-w-[1180px] grid-cols-2 gap-px bg-line lg:grid-cols-4">
            {[[snap.rule_count, "Rules extracted"], [snap.property_count, "Sample properties"], [docs, "Source documents read"], [cities, "Legal cities resolved"]].map(([n, l]) => (
              <div key={l} className="flex flex-col-reverse bg-white px-4 py-8 lg:px-8">
                <dt className="mt-2 text-[14px] text-muted">{l}</dt>
                <dd className="text-[40px] font-semibold leading-none tracking-[-0.03em] lg:text-[48px]">{n}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="mx-auto max-w-[1180px] px-4 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div><h2 className="text-[28px] font-semibold leading-tight sm:text-[36px]">How it works</h2>
            <p className="mt-2 max-w-[32ch] text-muted">Four steps, reproducible from the supplied corpus. No answer is written by hand.</p></div>
          <ol className="grid gap-x-10 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.t} className="border-t border-ink py-5">
                <p className="font-mono text-[13px] text-accent">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 text-[18px] font-semibold">{s.t}</h3>
                <p className="mt-1 text-[15px] text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-[1180px] px-4 md:grid-cols-3 lg:px-8">
          {[
            { href: "/app/check", t: "Check an address", d: "Search 500 sample buildings; get a cited, plain-language report in English or Spanish." },
            { href: "/app/changes", t: "Track law changes", d: "Compare two dates or a pending bill and see exactly which buildings are affected, and why." },
            { href: "/app/rules", t: "Browse the rule library", d: "Every extracted rule with its citation, effective date and verified source text." },
          ].map((c, i) => (
            <Link key={c.href} href={c.href} className={`group flex flex-col gap-2 py-10 md:px-8 ${i ? "border-t border-line md:border-l md:border-t-0" : "md:pl-0"}`}>
              <span className="flex items-center gap-2 text-[20px] font-semibold group-hover:text-accent">{c.t} <ArrowRight aria-hidden size={18} className="transition-transform group-hover:translate-x-1" /></span>
              <span className="text-[15px] text-muted">{c.d}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-[1180px] border-t border-line px-4 py-6 lg:px-8"><Disclaimer /></div>
    </main>
  );
}

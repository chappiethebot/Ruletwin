import Link from "next/link";
import type { Evaluation, Rule } from "@/lib/engine/types";
import type { Resolution } from "@/lib/engine/resolve";
import { CATEGORIES, type Category } from "@/lib/engine/types";

export type Lang = "en" | "es";

const T = {
  en: {
    title: "In plain words", lead: "What this means for a renter at this address on", none: "No rule in the supplied law covers this.",
    applies: "Applies", superseded: "A local rule governs instead", unknown: "Depends on", nye: "Not in effect yet — starts", pending: "Proposed only — not law",
    cats: { rent_increase_limits: "Rent increases", just_cause_eviction: "Eviction protection", security_deposits: "Security deposit",
      application_screening_fees: "Application fees", screening_restrictions: "Tenant screening", algorithmic_rent_setting: "Rent-pricing software" },
    disclaimer: "Legal information, not legal advice.", switch: "Ver en español", english: "",
  },
  es: {
    title: "En palabras sencillas", lead: "Qué significa para un inquilino en esta dirección al", none: "Ninguna norma de las leyes incluidas cubre esto.",
    applies: "Se aplica", superseded: "Rige una norma local en su lugar", unknown: "Depende de", nye: "Aún no vigente — comienza", pending: "Solo propuesta — no es ley",
    cats: { rent_increase_limits: "Aumentos de renta", just_cause_eviction: "Protección contra desalojo", security_deposits: "Depósito de garantía",
      application_screening_fees: "Cuotas de solicitud", screening_restrictions: "Evaluación de inquilinos", algorithmic_rent_setting: "Software para fijar rentas" },
    disclaimer: "Información legal, no asesoría legal.", switch: "View in English", english: "(texto disponible solo en inglés)",
  },
} as const;

// Renter-facing summary built only from the evaluated results (no new reasoning).
export function RenterSummary({ evaluations, rules, asOf, lang, labels, switchHref }: {
  evaluations: (Evaluation & { resolution?: Resolution })[]; rules: Map<string, Rule>; asOf: string; lang: Lang;
  labels: Record<string, string>; switchHref: string;
}) {
  const t = T[lang];
  const order = ["applies", "superseded", "unknown", "not_yet_effective", "pending"];
  return (
    <section aria-labelledby="renter-summary" lang={lang} className="rounded-3xl bg-bg p-6 sm:p-10">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="renter-summary" className="text-[24px] font-semibold">{t.title}</h2>
        <Link href={switchHref} className="ml-auto flex min-h-10 items-center rounded-full border border-line bg-white px-4 text-[14px] font-medium transition-colors hover:border-ink" lang={lang === "en" ? "es" : "en"}>{t.switch}</Link>
      </div>
      <p className="text-[14px] text-muted">{t.lead} <span className="font-mono">{asOf}</span>.</p>
      <dl className="mt-6 flex flex-col divide-y divide-line">
        {CATEGORIES.map((cat: Category) => {
          const items = evaluations.filter((e) => e.result !== "not_applicable" && rules.get(e.rule_id)?.category === cat)
            .sort((a, b) => order.indexOf(a.result) - order.indexOf(b.result));
          return (
            <div key={cat} className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[200px_1fr]">
              <dt className="font-semibold">{t.cats[cat]}</dt>
              <dd className="flex flex-col gap-1 text-[15px]">
                {items.length ? items.map((e) => {
                  const r = rules.get(e.rule_id)!;
                  const status = e.result === "applies" ? t.applies : e.result === "superseded" ? t.superseded
                    : e.result === "unknown" ? `${t.unknown}: ${(e.resolution?.decisive ?? []).map((d) => labels[d] ?? d).join(", ") || e.missing_facts.join(", ")}`
                    : e.result === "not_yet_effective" ? `${t.nye} ${r.effective_date}` : t.pending;
                  const text = lang === "es" ? r.requirement_es ?? `${r.requirement} ${t.english}` : r.requirement;
                  return <p key={e.rule_id}><strong>{status}.</strong> {text} <span className="font-mono text-[12px] text-muted">({r.citation})</span></p>;
                }) : <p className="text-muted">{t.none}</p>}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-6 text-[13px] text-muted">{t.disclaimer}</p>
    </section>
  );
}

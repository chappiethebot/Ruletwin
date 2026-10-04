"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { btnPrimary, input } from "./ui";

export interface PropertyOption { id: string; address: string; postal: string; state: string; county: string | null; city: string | null; facts: string }

export function AddressSearch({ options, defaultDate }: { options: PropertyOption[]; defaultDate: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [selected, setSelected] = useState<PropertyOption | null>(null);
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return options.filter((o) => `${o.address} ${o.postal} ${o.state} ${o.city ?? ""} ${o.id}`.toLowerCase().includes(t)).slice(0, 8);
  }, [q, options]);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => { e.preventDefault(); const pick = selected ?? matches[0]; if (pick && validDate) router.push(`/app/properties/${pick.id}?asOf=${date}`); }}
    >
      <div className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-start">
        <div className="relative">
          <label htmlFor="addr" className="mb-1 block text-[14px] font-medium">Address in the sample</label>
          <div className="relative">
            <Search aria-hidden size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input id="addr" className={`${input} pl-10`} placeholder="Street, city or ID (e.g. Fillmore)"
              value={q} autoComplete="off" role="combobox" aria-expanded={matches.length > 0 && !selected} aria-controls="addr-list"
              onChange={(e) => { setQ(e.target.value); setSelected(null); }} />
          </div>
          {matches.length > 0 && !selected && (
            <ul id="addr-list" role="listbox" aria-label="Matching sample addresses" className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-line bg-card shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
              {matches.map((m) => (
                <li key={m.id} role="option" aria-selected={false}>
                  <button type="button" className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-bg focus:bg-bg"
                    onClick={() => { setSelected(m); setQ(`${m.address}, ${m.postal}, ${m.state}`); }}>
                    <span className="font-medium">{m.address}, {m.postal}, {m.state}</span>
                    <span className="text-[13px] text-muted">
                      <span className="font-mono">{m.id}</span> · legal city: {m.city ?? "unresolved"} · {m.facts}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {q && !matches.length && !selected && (
            <p className="mt-2 text-[13px] text-muted" role="status">
              No sample address matches. This release covers the ~500 supplied sample properties only, not every US address.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="asof" className="mb-1 block text-[14px] font-medium">As of date</label>
          <input id="asof" type="date" className={`${input} font-mono`} value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div><span aria-hidden className="mb-1 hidden text-[14px] md:invisible md:block">&nbsp;</span>
          <button type="submit" className={`${btnPrimary} w-full`} disabled={!(selected || matches.length) || !validDate}>Analyze rules</button></div>
      </div>
      {selected && (
        <div className="rounded-lg bg-bg p-4 text-[14px]" aria-live="polite">
          <p className="font-medium">{selected.address}, {selected.postal}, {selected.state} <span className="font-mono text-muted">({selected.id})</span></p>
          <p className="text-muted">Legal jurisdiction: {selected.state}{selected.county ? ` › ${selected.county}` : ""}{selected.city ? ` › ${selected.city}` : " › city unresolved"} · {selected.facts}</p>
        </div>
      )}
    </form>
  );
}

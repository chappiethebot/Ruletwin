"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

export interface PropertyOption { id: string; address: string; postal: string; state: string; county: string | null; city: string | null; facts: string }

export function AddressSearch({ options, defaultDate, variant }: { options: PropertyOption[]; defaultDate: string; variant?: "hero" }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [selected, setSelected] = useState<PropertyOption | null>(null);
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return options.filter((o) => `${o.address} ${o.postal} ${o.state} ${o.city ?? ""} ${o.id}`.toLowerCase().includes(t)).slice(0, 6);
  }, [q, options]);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const open = matches.length > 0 && !selected;

  return (
    <form onSubmit={(e) => { e.preventDefault(); const pick = selected ?? matches[0]; if (pick && validDate) router.push(`/app/properties/${pick.id}?asOf=${date}`); }}>
      <div className="relative">
        <div className="flex items-center gap-3 rounded-full border border-line bg-white pl-5 pr-1.5 transition-[border-color,box-shadow] duration-300 focus-within:border-ink focus-within:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.18)] hover:border-[#d6d6d1]">
          <Search aria-hidden size={18} className="shrink-0 text-muted" />
          <label htmlFor="addr" className="sr-only">Address in the sample</label>
          <input id="addr" className="h-14 min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
            placeholder="Search an address or city" value={q} autoComplete="off" role="combobox" aria-expanded={open} aria-controls="addr-list"
            onChange={(e) => { setQ(e.target.value); setSelected(null); }} />
          <button type="submit" aria-label="Check rules" disabled={!(selected || matches.length) || !validDate}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-[transform,opacity] duration-200 hover:scale-105 disabled:opacity-25 disabled:hover:scale-100">
            <ArrowRight aria-hidden size={18} />
          </button>
        </div>
        {open && (
          <ul id="addr-list" role="listbox" aria-label="Matching sample addresses"
            className="absolute z-20 mt-2 w-full animate-fade overflow-hidden rounded-2xl border border-line bg-white py-1.5 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.25)]">
            {matches.map((m) => (
              <li key={m.id} role="option" aria-selected={false}>
                <button type="button" className="flex w-full items-baseline gap-3 px-5 py-2.5 text-left transition-colors hover:bg-bg focus:bg-bg focus:outline-none"
                  onClick={() => { setSelected(m); setQ(`${m.address}, ${m.postal}, ${m.state}`); }}>
                  <span className="min-w-0 flex-1 truncate font-medium">{m.address}, {m.postal}</span>
                  <span className="shrink-0 text-[13px] text-muted">{m.city ?? "city unresolved"}, {m.state}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {q && !matches.length && !selected && (
          <p className="mt-3 px-5 text-[13px] text-muted" role="status">No sample address matches. This release covers the 500 supplied sample buildings.</p>
        )}
      </div>
      <div className={`mt-3 flex items-center gap-2 px-5 text-[13px] text-muted ${variant === "hero" ? "justify-center" : ""}`}>
        <label htmlFor="asof">As of</label>
        <input id="asof" type="date" value={date} onChange={(e) => setDate(e.target.value)} required
          className="rounded-md bg-transparent px-1 py-0.5 font-mono text-ink transition-colors hover:bg-bg" />
      </div>
    </form>
  );
}

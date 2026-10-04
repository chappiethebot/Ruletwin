import Link from "next/link";
import { AddressSearch } from "@/components/address-search";
import { getSnapshot, propertyOptions } from "@/lib/data";

export const dynamic = "force-dynamic"; // follows the active snapshot

const EXAMPLES = [
  { id: "A0016", label: "3515 Fillmore St, San Francisco" },
  { id: "A0005", label: "1609 Addison St, Berkeley" },
  { id: "A0002", label: "1031 Clinton St, Hoboken" },
];

export default function Home() {
  const snap = getSnapshot();
  const asOf = snap?.default_as_of ?? "2026-10-01";
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-8.5rem)] max-w-[760px] flex-col justify-center px-4 py-16 text-center">
      <h1 className="animate-rise text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[72px]">
        Rental law,<br /><span className="text-accent">by address.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-[46ch] animate-rise text-[17px] text-muted [animation-delay:80ms] sm:text-[19px]">
        See which housing rules apply to a building on any date, each one traced to the exact sentence of law.
      </p>

      {snap ? (
        <div className="mt-10 animate-rise text-left [animation-delay:160ms]">
          <AddressSearch options={propertyOptions(snap)} defaultDate={asOf} variant="hero" />
          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14px] text-muted">
            <span>Try</span>
            {EXAMPLES.map((e) => (
              <Link key={e.id} href={`/app/properties/${e.id}?asOf=${asOf}`}
                className="text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent">
                {e.label}
              </Link>
            ))}
          </p>
        </div>
      ) : <p className="mt-10 text-muted">No snapshot published yet.</p>}

    </main>
  );
}

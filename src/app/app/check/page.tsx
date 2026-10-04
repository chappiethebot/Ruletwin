import { AddressSearch, type PropertyOption } from "@/components/address-search";
import { Card, Disclaimer } from "@/components/ui";
import { getSnapshot } from "@/lib/data";
import { describeFact } from "@/lib/engine/engine";
import { NoSnapshot } from "@/components/no-snapshot";

export default function CheckPage() {
  const snap = getSnapshot();
  if (!snap) return <NoSnapshot />;
  const options: PropertyOption[] = snap.properties.map((p) => ({
    id: p.address_id, address: p.street_address, postal: p.postal_city, state: p.state, county: p.county ?? null, city: p.city,
    facts: `built ${p.facts.year_built?.state === "known" ? p.facts.year_built.lo : "unknown"} · units ${describeFact(p.facts.units).split(" · ")[0]}`,
  }));
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">Check an address</h1>
        <p className="text-muted">Pick a sample property and a date to see which rules apply, which depend on missing facts, and what is pending.</p>
      </div>
      <Card><AddressSearch options={options} defaultDate={snap.default_as_of} /></Card>
      <Disclaimer snapshot={snap.id} />
    </div>
  );
}

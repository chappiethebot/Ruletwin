import { AddressSearch } from "@/components/address-search";
import { Card, Disclaimer } from "@/components/ui";
import { getSnapshot, propertyOptions } from "@/lib/data";
import { NoSnapshot } from "@/components/no-snapshot";

export default function CheckPage() {
  const snap = getSnapshot();
  if (!snap) return <NoSnapshot />;
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] sm:text-[40px]">Check an address</h1>
        <p className="mt-1 max-w-[60ch] text-muted">Search a sample property and pick a date. You get every rule that applies, which ones depend on missing facts, and what is pending.</p>
      </div>
      <Card><AddressSearch options={propertyOptions(snap)} defaultDate={snap.default_as_of} /></Card>
      <Disclaimer snapshot={snap.id} />
    </div>
  );
}

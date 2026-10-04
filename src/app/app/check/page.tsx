import { AddressSearch } from "@/components/address-search";
import { getSnapshot, propertyOptions } from "@/lib/data";
import { NoSnapshot } from "@/components/no-snapshot";

export default function CheckPage() {
  const snap = getSnapshot();
  if (!snap) return <NoSnapshot />;
  return (
    <div className="mx-auto flex max-w-[720px] animate-rise flex-col gap-10 py-8">
      <div>
        <h1 className="text-[36px] font-semibold tracking-[-0.03em] sm:text-[48px]">Check an address</h1>
        <p className="mt-2 text-[17px] text-muted">Search any of the {snap.property_count} sample buildings in California, New Jersey and Massachusetts.</p>
      </div>
      <AddressSearch options={propertyOptions(snap)} defaultDate={snap.default_as_of} />
    </div>
  );
}

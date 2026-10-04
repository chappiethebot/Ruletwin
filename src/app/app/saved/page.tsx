import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { Card, Disclaimer } from "@/components/ui";
import { currentUser, getDb } from "@/lib/auth";
import { listReports, listSavedProperties } from "@/lib/db";
import { deleteReportAction, toggleSaveProperty } from "@/lib/actions";
import { getSnapshot } from "@/lib/data";

export default async function SavedPage(props: PageProps<"/app/saved">) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/app/saved");
  const sp = await props.searchParams;
  const snap = getSnapshot();
  const props_ = new Map((snap?.properties ?? []).map((p) => [p.address_id, p]));
  const saved = listSavedProperties(getDb(), user.id);
  const reports = listReports(getDb(), user.id);
  const label = (id: string) => { const p = props_.get(id); return p ? `${p.street_address}, ${p.postal_city}, ${p.state}` : id; };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-[-0.03em] sm:text-[40px]">Saved properties</h1>
        <p className="text-muted">Private to {user.email}.</p>
      </div>
      {sp.report && <p role="status" className="rounded-lg border border-ok/30 bg-ok-soft p-3 text-[14px] text-ok">Report saved.</p>}
      <Card>
        <h2 className="mb-3 text-[17px] font-semibold">Properties</h2>
        {saved.length ? (
          <ul className="flex flex-col divide-y divide-line">
            {saved.map((s) => (
              <li key={s.property_id} className="flex flex-wrap items-center gap-3 py-2">
                <Link href={`/app/properties/${s.property_id}`} className="flex-1 text-accent underline">{label(s.property_id)}</Link>
                <span className="font-mono text-[12px] text-muted">{s.created_at.slice(0, 10)}</span>
                <form action={toggleSaveProperty}><input type="hidden" name="property_id" value={s.property_id} />
                  <button className="flex min-h-11 items-center gap-1 rounded-lg px-3 text-[14px] text-muted hover:bg-bg"><Trash2 aria-hidden size={15} /> Remove</button></form>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted">No saved properties yet. Open a property from <Link className="text-accent underline" href="/app/check">Check address</Link> and choose “Save property”.</p>}
      </Card>
      <Card>
        <h2 className="mb-3 text-[17px] font-semibold">Saved reports</h2>
        {reports.length ? (
          <ul className="flex flex-col divide-y divide-line">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-2">
                <span className="flex-1">{label(r.property_id)} <span className="block font-mono text-[12px] text-muted">as of {r.as_of_date} · {r.snapshot_id}{r.snapshot_id !== snap?.id ? " (older snapshot)" : ""}</span></span>
                <a href={`/api/reports/${r.id}`} className="flex min-h-11 items-center gap-1 rounded-lg px-3 text-[14px] text-accent hover:bg-accent-soft"><Download aria-hidden size={15} /> Proof JSON</a>
                <form action={deleteReportAction}><input type="hidden" name="id" value={r.id} />
                  <button className="flex min-h-11 items-center gap-1 rounded-lg px-3 text-[14px] text-muted hover:bg-bg"><Trash2 aria-hidden size={15} /> Delete</button></form>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted">No saved reports. Use “Save report” on a property page; the report keeps the snapshot it was computed from.</p>}
      </Card>
      <Disclaimer />
    </div>
  );
}

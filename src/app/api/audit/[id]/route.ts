import { auditRows, getSnapshot, isDate, resolveFor } from "@/lib/data";

// Public audit trail for one property and date (no account needed; official facts only).
export async function GET(req: Request, ctx: RouteContext<"/api/audit/[id]">) {
  const { id } = await ctx.params;
  const asOfParam = new URL(req.url).searchParams.get("asOf");
  const snap = getSnapshot();
  if (!snap) return new Response("No snapshot", { status: 503 });
  const asOf = isDate(asOfParam) ? asOfParam : snap.default_as_of;
  const r = resolveFor(snap, id, asOf);
  if (!r) return new Response("Not found", { status: 404 });
  const body = {
    property: { address_id: r.property.address_id, address: `${r.property.street_address}, ${r.property.postal_city}, ${r.property.state}`,
      jurisdiction: [r.property.state, r.property.county, r.property.city].filter(Boolean), city_evidence: r.property.city_evidence },
    as_of: asOf, snapshot: snap.id, engine_version: snap.engine_version,
    answers: auditRows(snap, r, asOf), open_questions: r.resolution.questions.map((q) => ({ id: q.id, question: q.question, decides: q.decisive_for })),
    disclaimer: "Legal information, not legal advice.",
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": `attachment; filename="ruletwin-audit-${id}-${asOf}.json"` },
  });
}

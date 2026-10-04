import { currentUser, getDb } from "@/lib/auth";
import { getReport } from "@/lib/db";

// Private proof bundle download: owner only.
export async function GET(_: Request, ctx: RouteContext<"/api/reports/[id]">) {
  const user = await currentUser();
  if (!user) return new Response("Sign in required", { status: 401 });
  const { id } = await ctx.params;
  const r = getReport(getDb(), user.id, Number(id));
  if (!r) return new Response("Not found", { status: 404 });
  return new Response(r.result_json, {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="ruletwin-${r.property_id}-${r.as_of_date}.json"`,
      "cache-control": "private, no-store",
    },
  });
}

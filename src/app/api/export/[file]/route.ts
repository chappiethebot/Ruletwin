import fs from "node:fs";
import path from "node:path";

const FILES = new Set(["rules.json", "lookups.json", "changes.json"]);

// Public download of the official submission exports produced by `npm run publish`.
export async function GET(_: Request, ctx: RouteContext<"/api/export/[file]">) {
  const { file } = await ctx.params;
  const p = path.join(process.cwd(), "submission", file);
  if (!FILES.has(file) || !fs.existsSync(p)) return new Response("Not found", { status: 404 });
  return new Response(fs.readFileSync(p), {
    headers: { "content-type": "application/json", "content-disposition": `attachment; filename="${file}"` },
  });
}

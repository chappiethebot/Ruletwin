// For a public repository: replace team-captured third-party pages (copyrighted news /
// law-firm text) with a stub that keeps the source metadata and only the exact spans
// RuleTwin's rules quote. Publication gates accept stubs (quotes must appear verbatim).
// Usage: node scripts/public-stubs.ts <file.txt> [<file.txt> ...]
import fs from "node:fs";
import path from "node:path";
import { STUB_MARK } from "./publish.ts";
import { DATA_DIR, readJson } from "./config.ts";

const cands = readJson<{ doc_id: string; quoted_span: string; conditions: { any: { quote: string }[] }[]; exemption_logic: { quote: string; all: { quote: string }[] }[] }[]>(
  path.join(DATA_DIR, "extraction", "candidates.json"));
for (const file of process.argv.slice(2)) {
  const docId = path.basename(file, ".txt");
  const text = fs.readFileSync(file, "utf8");
  if (text.includes(STUB_MARK)) { console.log(`${file}: already a stub`); continue; }
  const header = text.split(/\n\s*\n/)[0];
  const spans = [...new Set(cands.filter((c) => c.doc_id === docId).flatMap((c) => [c.quoted_span,
    ...c.conditions.flatMap((g) => g.any.map((a) => a.quote)), ...c.exemption_logic.flatMap((e) => [e.quote, ...e.all.map((a) => a.quote)])])
    .filter((q) => q && text.includes(q)))];
  fs.writeFileSync(file, `${header}\n\n${STUB_MARK}: third-party page (copyright). Read it at the SOURCE URL above.\nExact spans quoted by RuleTwin rules:\n\n${spans.map((s) => `---\n${s}`).join("\n")}\n`);
  console.log(`${file}: stub with ${spans.length} spans`);
}

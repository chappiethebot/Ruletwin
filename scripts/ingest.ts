// One command to add a new ordinance or jurisdiction through the same pipeline
// (v5 stretch goal "extend to one new jurisdiction"; also the live automated-extraction demo):
//   1. automated extraction of the new text (same extractor, prompt and validation),
//   2. an extension change case: a supplied test JSON if given, otherwise "as-of date vs
//      the day after the new rule's effective date", targeting the rules extracted from it,
//   3. publication through the normal gates. Extension cases appear in the website only;
//      the official changes.json keeps exactly the supplied test ids (T1-T5).
// Usage (PowerShell, from the repo root):
//   node scripts/ingest.ts --file <ordinance.txt> --jurisdiction "City, ST" [--doc-id X001] [--url <url>] [--test-id EXT1] [--test <test.json>]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { ChangeTest } from "../src/lib/engine/changes.ts";
import { consolidate } from "./publish.ts";
import { DATA_DIR, ROOT, readJson, writeJson } from "./config.ts";

const args = process.argv.slice(2);
const arg = (f: string, d?: string) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const file = arg("--file");
const jurisdiction = arg("--jurisdiction");
if (!file || !fs.existsSync(file) || !jurisdiction) {
  console.error('Usage: node scripts/ingest.ts --file <ordinance.txt> --jurisdiction "City, ST" [--doc-id X001] [--url <url>] [--test-id EXT1] [--test <test.json>]');
  process.exit(1);
}
const docId = arg("--doc-id", "X001")!;
const testId = arg("--test-id", "EXT1")!;
const url = arg("--url", "local file")!;
const asOf = arg("--as-of", "2026-10-01")!;

const run = (script: string, extra: string[]) => {
  console.log(`\n> node ${script} ${extra.join(" ")}`);
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", script), ...extra], { stdio: "inherit", cwd: ROOT });
  if (r.status !== 0) { console.error(`${script} failed (exit ${r.status}).`); process.exit(r.status ?? 1); }
};

// 1. Extraction (needs the Claude CLI login or ANTHROPIC_API_KEY).
run("extract.ts", ["--file", path.resolve(file), "--doc-id", docId, "--jurisdiction", jurisdiction, "--url", url]);

// 2. Extension change case.
const cands = readJson<{ doc_id: string; effective_date: string | null }[]>(path.join(DATA_DIR, "extraction", "candidates.json"));
const mine = cands.filter((c) => c.doc_id === docId);
if (!mine.length) { console.error(`No rule was extracted from ${docId}; nothing to track. See data/extraction/ledger.json.`); process.exit(1); }
const ids = consolidate(cands as never).filter((r) => r.source.doc_id === docId || r.extraction.review.some((x) => x.includes(docId))).map((r) => r.team_rule_id);
const extraFile = path.join(DATA_DIR, "extra_change_tests.json");
const extra: ChangeTest[] = (fs.existsSync(extraFile) ? readJson<ChangeTest[]>(extraFile) : []).filter((t) => t.test_id !== testId);
const supplied = arg("--test");
if (supplied) {
  const t = readJson<ChangeTest | ChangeTest[]>(supplied);
  extra.push(...(Array.isArray(t) ? t : [t]).map((x) => ({ ...x, team_rule_ids: ids })));
} else {
  const eff = mine.map((c) => c.effective_date).filter(Boolean).sort().at(-1) ?? null;
  const after = eff && /^\d{4}-\d{2}-\d{2}$/.test(eff) ? new Date(Date.parse(`${eff}T00:00:00Z`) + 864e5).toISOString().slice(0, 10) : asOf;
  extra.push({ test_id: testId, title: `New ${jurisdiction} ordinance (${docId})`, type: "as_of", rule_ids: [], team_rule_ids: ids,
    as_of_before: asOf, as_of_after: after > asOf ? after : asOf, states: [jurisdiction.split(", ")[1]],
    expected_behavior: `Extracted automatically from ${docId}; effective ${eff ?? "not stated"}.` });
}
writeJson(extraFile, extra);
console.log(`\n${testId} targets ${ids.join(", ")} (${mine.length} extracted record(s); effective ${mine.map((c) => c.effective_date ?? "n/a").join(", ")})`);

// 3. Publish through the normal gates.
run("publish.ts", ["--as-of", asOf]);
console.log(`\n${testId} is visible under Changes in the website (not in the official changes.json). Restart: npm run build; npm run start`);

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { consolidate, loadProperties, publishGates } from "./publish.ts";
import { DATA_DIR, STARTER_DIR, readJson } from "./config.ts";

const ready = fs.existsSync(path.join(STARTER_DIR, "schema", "rule_record.schema.json")) && fs.existsSync(path.join(DATA_DIR, "extraction", "candidates.json"));

test("publish gates enforce supplied schema types, array items and numeric bounds", { skip: !ready && "starter pack or candidates not present" }, () => {
  const cands = readJson<any[]>(path.join(DATA_DIR, "extraction", "candidates.json"));
  const ledger = readJson<any[]>(path.join(DATA_DIR, "extraction", "ledger.json"));
  const rules = consolidate(cands);
  const props = loadProperties();
  for (const patch of [{ confidence: "high" }, { confidence: -0.1 }, { confidence: 1.1 }, { confidence: NaN }, { confidence: Infinity }, { overrides: "rule-id" }, { overrides: [42] }, { conflict_flag: "false" }, { coverage_conditions: [] }]) {
    const malformed = rules.map((r, i) => i === 0 ? { ...r, ...patch } as typeof r : r);
    assert.ok(publishGates(malformed, props, cands, ledger, [], "2026-10-01").length > 0, JSON.stringify(patch));
  }
  const nullable = rules.map(r => ({ ...r, confidence: null, coverage_conditions: {}, overrides: ["rule-id"] } as unknown as typeof r));
  assert.deepEqual(publishGates(nullable, props, cands, ledger, [], "2026-10-01"), []);
});

test("publish gates pass the real bundle and fail closed on corruption (F04)", { skip: !ready && "starter pack or candidates not present" }, () => {
  const cands = readJson<any[]>(path.join(DATA_DIR, "extraction", "candidates.json"));
  const ledger = readJson<any[]>(path.join(DATA_DIR, "extraction", "ledger.json"));
  const rules = consolidate(cands);
  const props = loadProperties();
  assert.deepEqual(publishGates(rules, props, cands, ledger, [], "2026-10-01"), []);

  const corruptQuote = rules.map((r, i) => (i === 0 ? { ...r, quoted_span: r.quoted_span.replace(/.$/, "#") } : r));
  assert.ok(publishGates(corruptQuote, props, cands, ledger, [], "2026-10-01").some((p) => p.includes("quoted_span does not match")));

  const badEnum = rules.map((r, i) => (i === 0 ? { ...r, category: "rent_control" as never } : r));
  assert.ok(publishGates(badEnum, props, cands, ledger, [], "2026-10-01").some((p) => p.includes("not in enum")));

  assert.ok(publishGates(rules, [...props, props[0]], cands, ledger, [], "2026-10-01").some((p) => p.includes("duplicate address_id")));
  assert.ok(publishGates(rules, props, cands, [...ledger, { doc_id: "Z1", disposition: "error" }], [], "2026-10-01").some((p) => p.includes("extraction errors")));

  const forged = { id: "f", subject: { rule_id: rules[0].team_rule_id, level: "law", key: "k" }, field: "rule_status", value: "not-a-status",
    valid: { from: null, to_exclusive: null }, source: { adapter: "x", url: "https://x.gov", retrieved_at: "2026-10-04T00:00:00Z", span: "xyz", terms: "" },
    match: { method: "m", matched: "", confidence: "exact" }, provenance: "automated", status: "validated", reasons: [] };
  assert.ok(publishGates(rules, props, cands, ledger, [forged as never], "2026-10-01").some((p) => p.includes("re-validation gives rejected")));
});

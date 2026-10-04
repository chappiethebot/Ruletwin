import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyCorpusCitation, type SuppliedCorpus } from "./corpus.ts";
import type { Rule } from "./engine/types.ts";

const quote = "No landlord shall use the service.";
const corpus: SuppliedCorpus = new Map([
  ["D001", { url: "https://example.gov/law", text: `Intro\n${quote}\nEnd`, sha256: "pinned-text-hash" }],
  ["D037", { url: "https://example.gov/link-only", text: null, sha256: null }],
]);
const rule: Pick<Rule, "source" | "source_doc_id" | "source_url" | "quoted_span"> = {
  source_doc_id: "D001", source_url: "https://example.gov/law", quoted_span: quote,
  source: { doc_id: "D001", url: "https://example.gov/law", start: 6, end: 6 + quote.length,
    retrieved_at: null, source_type: "official" },
};

test("supplied citation requires exact mapped text, URL, identity and offsets", () => {
  assert.deepEqual(verifyCorpusCitation(rule, corpus), { eligible: true, doc_id: "D001",
    text_sha256: "pinned-text-hash", reason: "Exact headline quote verified against supplied corpus text." });
  for (const changed of [
    { ...rule, source_doc_id: "D002" },
    { ...rule, source_url: "https://example.gov/other" },
    { ...rule, source: { ...rule.source, url: "https://example.gov/other" } },
    { ...rule, source: { ...rule.source, start: 7 } },
    { ...rule, source: { ...rule.source, start: -1 } },
    { ...rule, source: { ...rule.source, start: 6.5 } },
    { ...rule, source: { ...rule.source, end: 5000 } },
    { ...rule, quoted_span: "" },
    { ...rule, quoted_span: "FULL TEXT NOT REDISTRIBUTED" },
  ]) assert.equal(verifyCorpusCitation(changed, corpus).eligible, false, JSON.stringify(changed));
});

test("D-prefix link-only entries and same-URL research copies earn no supplied-text eligibility", () => {
  for (const docId of ["D037", "S037", "D999", "X001"]) {
    const research = { ...rule, source_doc_id: docId, source_url: "https://example.gov/link-only",
      source: { ...rule.source, doc_id: docId, url: "https://example.gov/link-only" } };
    assert.equal(verifyCorpusCitation(research, corpus).eligible, false, docId);
  }
});

test("quote offsets use Node UTF-16 units when a source contains non-BMP characters", () => {
  const text = `\u{1F3E0}${quote}`;
  const unicodeCorpus: SuppliedCorpus = new Map([["D001", { ...corpus.get("D001")!, text }]]);
  assert.equal(verifyCorpusCitation({ ...rule, source: { ...rule.source, start: 2, end: text.length } }, unicodeCorpus).eligible, true);
  assert.equal(verifyCorpusCitation({ ...rule, source: { ...rule.source, start: 1, end: text.length } }, unicodeCorpus).eligible, false);
});

// Citation provenance only. Applicability remains in engine/.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parseCsv } from "./engine/facts.ts";
import type { Rule, CorpusCitation } from "./engine/types.ts";

export interface SuppliedDocument { url: string; text: string | null; sha256: string | null }
export type SuppliedCorpus = Map<string, SuppliedDocument>;

// Read only the distributed manifest; supplementary and extra manifests cannot
// promote a research copy to supplied text, even if their URL or ID matches.
export function loadSuppliedCorpus(corpusDir: string): SuppliedCorpus {
  const root = fs.realpathSync(corpusDir);
  const corpus: SuppliedCorpus = new Map();
  for (const row of parseCsv(fs.readFileSync(path.join(root, "corpus_manifest.csv"), "utf8"))) {
    if (corpus.has(row.doc_id)) throw new Error(`duplicate supplied doc_id: ${row.doc_id}`);
    let text: string | null = null;
    if (row.status === "ok" && row.text_file) {
      const file = fs.realpathSync(path.resolve(root, row.text_file));
      const relative = path.relative(root, file);
      if (path.isAbsolute(relative) || relative === ".." || relative.startsWith(`..${path.sep}`))
        throw new Error(`supplied text outside corpus: ${row.doc_id}`);
      text = fs.readFileSync(file, "utf8");
    }
    corpus.set(row.doc_id, { url: row.url, text, sha256: text === null ? null
      : crypto.createHash("sha256").update(text).digest("hex") });
  }
  return corpus;
}

// This proves exact headline support, not legal entailment or complete coverage
// of every condition, exemption, date or penalty in a compiled rule.
export function verifyCorpusCitation(rule: Pick<Rule, "source" | "source_doc_id" | "source_url" | "quoted_span">, corpus: SuppliedCorpus): CorpusCitation {
  const doc = corpus.get(rule.source.doc_id);
  const result = (eligible: boolean, reason: string): CorpusCitation => ({ eligible,
    doc_id: doc ? rule.source.doc_id : null, text_sha256: doc?.sha256 ?? null, reason });
  if (!doc) return result(false, "Source is not mapped in the distributed corpus.");
  if (doc.text === null) return result(false, "Manifest entry is link-only; no supplied text.");
  if (rule.source_doc_id !== rule.source.doc_id || rule.source_url !== doc.url || rule.source.url !== doc.url)
    return result(false, "Document identity or URL differs from the distributed manifest.");
  const { start, end } = rule.source;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > doc.text.length || end <= start
    || !rule.quoted_span || doc.text.slice(start, end) !== rule.quoted_span)
    return result(false, "Quote does not match the supplied text at its recorded offsets.");
  return result(true, "Exact headline quote verified against supplied corpus text.");
}

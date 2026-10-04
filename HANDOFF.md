# HANDOFF

Current state: local prototype plus evidence resolution, with bounded audit repairs applied. HEAD `4f2681c`; latest uncommitted repairs strengthen publication schema checks and calendar-date validation. Active snapshot `snap-412366cbb46f` (previous `snap-495f3f21cc8b`, retained). No new publication in this continuation.

## Verified now (2026-10-04)
- `npm test`: **50/50**, zero skipped (engine, resolver, evidence, audit regressions, publish gates, config, DB isolation). The two new regressions failed before the shared-validator repairs and pass afterward.
- `npm run typecheck`, `npx eslint scripts src`, `npm run build`: clean.
- `npm run e2e` (headless Edge via CDP; 1440 px and 390 px): **16/16**, including the clarification loop.
- Exports: 53 rules pass the official schema; every `quoted_span` matches exactly at its recorded offsets (enforced by publish gates); 500/500 addresses; T1 250, T2 90, T3 140 (90 conflict flags), T4 110 (P1→S.2983, P2→H.5222 matched individually), T5 0.
- Lookups (2026-10-01): applies 3381, superseded 289, unknown 691, not yet effective 140, pending 440.
- Working replay: 26,500 pairs, 691 unknowns across 339 properties, 581 questions, zero enumeration limits. All 500 active lookups agree with the current resolver. All 53 official rules pass independent Draft 2020-12 validation. Original 680/704 unknown totals describe older input bundles.
- Current source hash differs from the active snapshot's recorded engine hash because the latest validation repairs are uncommitted/unpublished. Do not describe that snapshot as a complete release of the newest code.
- Reference set (`data/reference/reference.json`, 37 cases, AI-reviewed and not independent; see `docs/EVALUATION.md`): enrichment config 32 correct / 33 definite answers, 0 wrong, 1 overclaim (C35), 0 conflicting outputs, resolution coverage 1.00 on definite-expected cases. **Not an accuracy claim.**

## Pipeline
`npm run geocode` → `node scripts/extract.ts` (needs the Claude CLI login or `ANTHROPIC_API_KEY`) → `node scripts/enrich.ts` (needs Python + `pypdf`) → `npm run publish` → `node scripts/measure.ts` → `npm run build && npm run start` → `npm run e2e`.
PowerShell: `$env:STRICT_EXEMPTIONS='1'` then `npm run publish` keeps untestable exemptions unknown. CO/affordability assumptions remain; this is not a fully evidence-only configuration. Use `npm run publish -- --dry-run` for read-only evaluation. Measurement regenerates reference results and the evaluation document.

## Evidence layer (docs/EVIDENCE_SOURCES.md)
- Automated: Census ZCTA→place, MassGIS MAD (street-in-ZIP corroboration), NJGIN geocoder + NJ municipal polygons, NJ MOD-IV (no owner fields), LADBS COs, San Diego codified history (section-anchored), municipal assessor-roll membership.
- Not automatable: ZIMAS RSO status (no documented API) → verified-record import (`data/evidence/verified/*.json`, reviewer required).
- Address identity: 491/500 usable Census legal-city resolutions; A0009's cached wrong "5 WESTERN AVE" match is rejected. Evidence resolves eight of the nine unresolved rows; A0346 remains ambiguous (ZIP-only, uncorroborated, shared conclusions only).

## Open findings (docs/AUDIT.md "Repair status, third pass")
High: F17 policy (default keeps disclosed presumptions; strict mode available), F18 section/definition completeness, F19 historical versions (null start dates), F20 field-level provenance for condition quotes, F22 independent review. Medium: F21 effect completeness/penalties, F23 offline receipt, F24 pinned model/vintage, F16 combobox keyboard. Known output defect: C35 (Berkeley March 2026 date absent from corpus text).

F08 is only partly repaired: CO bounds are disclosed and cannot reject observed CO evidence, but the one-year lag is unverified. F27 shorthand is now disclosed, not independently validated. F01/F04 repairs cover the observed defects; complete archival replay, release concurrency and source entailment are not established. See the newest audit section for precise scopes.

## Not done / external
- No `score.py` / dev key in the pack; no organizer score exists.
- T6 is optional unless the controlling brief requires it; no actual T6 input was exercised. Supported path: `node scripts/extract.ts --file <txt> --doc-id T6A --jurisdiction "Cambridge, MA" --url <url>`, then review, enrich and publish.
- Two brief variants exist (see docs/SUBMISSION_READINESS.md); confirm which governs. GitHub remote, videos and live link are not set up.

## Env var names
ANTHROPIC_API_KEY (optional), EXTRACT_MODEL (optional), STARTER_DIR (optional), STRICT_EXEMPTIONS (optional), ALLOW_PARTIAL (optional), BASE_URL / BROWSER (e2e, optional).

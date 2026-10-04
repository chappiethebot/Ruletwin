# RuleTwin challenge fit and submission readiness

Updated 2026-10-04 against commit `46e7c41`, both PDFs, the v5 pack and the judges' clarification. Full evidence: [V5_CHALLENGE_REVIEW.md](V5_CHALLENGE_REVIEW.md).

## Controlling requirements

V5 controls. All 65 pack files are byte-identical to the earlier participant download. No participant scorer/key or hour-16/T6 task is required. Videos show our own output and validation. Delivery is three JSON files, a live demo and a one-page method note. Team-captured link-only text does not earn citation credit unless organizers distribute/map it.

## Readiness

| Requirement | Verified implementation | Remaining work |
| --- | --- | --- |
| Automated extraction | 73 candidates, 48 rules, 89 ledger entries, zero extraction errors | Section/exception recall and each compiled field's support |
| Record content | Schema-valid; 45 nonempty key values, 17 nonempty penalties | Source-faithful dates, exemption effects and obligation completeness |
| Address lookup | All 500 addresses, 24,000 pairs, one engine and legal-city evidence | Independent boundary adjudication, material presumptions and unresolved A0346 |
| Citations | 45 supplied exact headline quotes; three research rules | Integrate actual-text eligibility; export under manifest IDs, keep flagged; add field-specific provenance |
| Change cases | 250/90/140/110/0 affected; T3 has 90 conflicts; export/replay sets match | Independent T2 address-set review; prevent extension overrides |
| Uncertainty | 511 unknown evaluations on 207 properties; 369 questions; no limits reached | Preserve unknowns; resolve C35/C37 and unsupported certainty |
| Stretch work | EN/ES, confidence/conflicts, audit download and ingestion command | Demonstrate actual extension extraction if claimed; confidence is not calibrated accuracy |
| Delivery | JSONs, method note, demo script and reachable public Git repository | Verify deployed URL and final demonstration against the frozen release |

The prototype addresses the central workflow. Complete independent legal reliability is not established. The AI-authored reference set returns 31 correct definite answers out of 33, three correctly indeterminate cases and one unmatched selector. That is an internal check, not an official score.

## Prepared repairs

Claude Code is still editing main. Fixes remain in `.cache/v5-review-46e7`; `.cache/audit/v5-alignment-fixes.patch` contains focused code/tests/documentation changes. Generated snapshots should be regenerated after integration.

The patch verifies eligibility against distributed manifest/text/URL/offsets, pins its hash/reason, preserves research source IDs, updates UI/audit labels, and prevents custom cases from replacing official tests. Applicability totals are unchanged. Its isolated snapshot `snap-3e8d479e4ac6` passes 55 tests, typecheck, lint, production Webpack build, independent schema/CSV/provenance checks and 16 browser journeys. Default Turbopack encountered the isolated dependency-junction limitation; repeat the normal production build after integration.

After the concurrent writer finishes, inspect drift, run `git apply --check` before applying, regenerate with `npm run publish`, repeat gates/build, and test the deployed release. Do not overwrite concurrent changes or copy the isolated active pointer.

## Priorities

1. Source-backed adjudication of Berkeley C35's uncertain date and NJ C37's exemption effect; review C32's unmatched selector.
2. Exact field spans through merging and a small section/exception inventory.
3. Separate observations from CO/subsidy/exemption presumptions. Strict exemptions is not a complete evidence-only policy. Measure sensitivity and retain indeterminate answers.
4. Declare missing supplied text for Santa Ana's algorithmic ban and Hoboken/Newark rent control; research captures are not corpus credit.
5. Bound historical answers and replay claims; pin fresh extraction/schema/compiler/geocoder identities when claiming repeatability.
6. Independent provision/boundary review, keyboard/accessibility checks, public demo and final one-page note.

No official score, universal legal accuracy or guaranteed win follows from local tests. No zero-unknown target, T6 implementation or request for the withheld scorer/key is needed.

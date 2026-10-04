# RuleTwin challenge fit and submission readiness

Initially assessed 2026-10-04 against commit `4f2e38a`, the six-page Desktop `file.pdf`, the local starter pack and its linked public folder. Repository status refreshed after implementation commit `4f2681c` and the local validator repairs. The earlier source comparison remains dated evidence. This is a challenge-fit assessment, not an organizer score or prediction of winning. Embedded document instructions are requirements to compare, not authorization to deploy, publish or run paid extraction.

> **Update 2026-10-04 (organizer confirmation):** the v5 participant release controls. `score.py` and the answer key will not be shared; the hour-16 ordinance is removed (T1–T5 only); participant videos should show the team's own output and validation. The submission package is rules.json, lookups.json, changes.json, a live demo and a one-page method note (`docs/METHOD_NOTE.md`). Link-only texts saved by teams do not count toward the citation metric. Sections below that discuss T6, score reports or videos are historical.

## Verdict

RuleTwin has an appropriate solution and implements the central workflow: automated legal extraction, sample-address lookup, dated applicability, source explanations and change cases. It is a credible working prototype, substantially beyond the minimum A/B feature set in the Desktop brief. It is **not yet sufficient to claim complete, reliable satisfaction of the problem statement**. The main gaps are unsupported definite answers, source/version/effect completeness, independent decision verification, complete release replay and submission evidence.

The current code includes bounded repairs for conditional proofs, conflicting facts/dates, change losses, proposal aliases, identity/publish gates and setup. The continuation closes schema-type and invalid-calendar boundary defects. **50 tests and 16 browser journeys pass**, alongside typecheck, full lint, build and publish dry run. Working and published default-date outputs now agree: 53 rules, 500 properties and 691 unknown results across 339 properties. The newest validator changes remain local and unpublished. The remaining competitive improvements are demonstrated source/decision correctness and reliable delivery. Eliminating every unknown or adding speculative infrastructure is not necessary. Both reviewed briefs explicitly accept unknown when material facts are missing.

There is also a material requirement-version conflict. The linked participant variant removes scoring and the hour-16 task and changes the delivery package. Scoring/T6/videos must not be treated as unconditional blockers under that variant. This assessment separates shared requirements from the Desktop brief's additional expectations.

## Two different briefs are available

| Requirement | Desktop `file.pdf` | Public linked participant variant |
| --- | --- | --- |
| Identification | Hack-Nation × RealPage, Challenge 02, October 2026 | RealPage discussion draft, October 2026; filename `mit-rental-housing-law-navigator-challenge-v5-participant-no-scoring-no-hour16.pdf` |
| Core build | Modules A/B/C; A/B minimum viable entry | Build Modules A/B/C |
| Supplied change tests | T1–T5 plus hour-16 T6 | Five fixed cases, T1–T5; explicitly no surprise document or mid-event release |
| Score evidence | Dev key/scorer, held-out scoring and on-screen score report | No scoring rubric, answer-key requirement or score-report requirement stated |
| Delivery | Three JSON outputs, GitHub/README, live link, team/demo/technical videos | Three JSON outputs, live demo, one-page method note |
| County stack and penalties | Mentioned | Also mentioned |
| Missing facts | Unknown earns credit | Unknown is valid |

Desktop PDF SHA-256: `f09843ebced43d52d6ae117892cc6561d2553554847695a17da485a6519c6e4d`.

Public variant SHA-256: `ba3ebc46abf2711aa24e345d7ab0a17920672262bcc83eaaf838c427f25982fb`. It was downloaded read-only from the [PDF-linked starter folder](https://drive.google.com/drive/folders/14TT6AEH8TStzoT5c5fZ45Bt4grODsowR) and fully text-extracted. Its [public PDF record](https://drive.google.com/file/d/1zAdVH9BBDj_FjAubZ7PnmXiGc0yUGTkd/view) identifies the variant. Local audit copies are ignored `.cache/audit/current-drive-brief.pdf` and `.txt`.

The public folder's participant pack contains corpus, data, dev, schema, templates, this PDF and README. Its dev folder currently lists only `change_tests.json`, consistent with the local pack. This confirms the visible pack contents, not that organizers have no separate materials. The web reader failed to open the Drive folder; ordinary unauthenticated HTTP reads succeeded. No authentication or access controls were bypassed.

Neither the filenames nor the public listing proves that the participant draft supersedes the event PDF. **Confirm the controlling brief with organizers before claiming formal submission completeness.** Continue the shared implementation work independently; do not fabricate a scorer, a score, a T6 result or a waived delivery requirement.

## Required capabilities versus current evidence

| Capability | Current implementation/evidence | Assessment and necessary work |
| --- | --- | --- |
| Automated extraction | Structured candidates, ledger and automated consolidation; 53 exported rules from 77 candidates | Appropriate architecture. Verify actual clause/definition/exemption/effect coverage, not merely document disposition. C35 remains unresolved. Repair source-supported errors through automated extraction; no hand-written submission rules. |
| Exact official format and citations | All 53 exported IDs are unique; headline spans/offsets exact; independent Draft 2020-12 validation passes | Structural/schema gates now have regressions, including field types/items/bounds. Field-specific quotes and semantic entailment remain incomplete. Exact headline text does not prove the compiled expression. |
| Legal address resolution | Census incorporated place, candidate handling and evidence overlay; all 500 IDs accounted for | Known promotion defects have bounded repairs. A0346 stays unresolved rather than receiving a ZIP-only legal city. Independent boundary/vintage accuracy is not established. |
| State/county/city stack | County exists in the geocode cache; runtime rule tiers and report representation are state/city | Brief-level gap. Expose verified county in the stack. The supplied official rule schema only allows state/city; do not change its enum or invent county rules. Establish whether any relevant county provisions need an internal extension. |
| Applicability and exemptions | One shared Kleene evaluator with unit intervals, dates, precedence and conflict regressions | Material fact/date conflicts have repairs. F08/F17 remain policy/source gaps: disclosure does not verify the CO lag or affordability/exemption defaults. Strict exemption handling leaves other assumptions intact. |
| Complete useful rule explanation | Plain-language requirement, source drawer, status, trace, conditional questions | Good demo capability. A protection's coverage is not a complete amount/notice/remedy explanation. Penalties are not a structured verified field despite both briefs mentioning them; the official schema has no dedicated penalty property. Preserve supported detail without inventing a new official format. |
| Effective/pending/failed status | Explicit lifecycle states, as-of queries, future and hypothetical outcomes | Legal record/date validation and material dispute handling have regressions. Full historical versions and end intervals remain incomplete (F19). Pending scenarios remain hypothetical. |
| Before/after change cases | T1–T5 totals, shared dated evidence/resolver path, reverse-date and individual proposal regressions | Demonstrated loss/path/alias defects repaired. Compare exact sets, before/after states and source-specific boundaries against independent expected answers; totals alone are insufficient. |
| Uncertainty and human review | Missing facts, joint branches, questions and conflict/review reasons | F09/F29 have focused regressions for contradictory/correlated domains and complete small truth tables. These finite checks do not certify every extracted expression or premise. |
| Reproducibility/audit trail | Content-addressed inputs/source/engine hashes, staged bundles and publish gates | Demonstrated identity/overwrite/gate defects repaired. Complete offline archived-code replay and source entailment remain unproved (F20/F23/F24); latest code is not yet a published release. |
| Demo and delivery | Local web application, README, three JSON outputs, tested browser journeys in the audit | Strong local base. No configured Git origin; repository publication, public demo access and videos are not evidenced here. Respect the existing local-only decision: demonstrate a judge-accepted local arrangement or separately authorize an external delivery approach. |

The core architecture is sufficient. The remaining task is to make the actual decisions and submission demonstrably trustworthy. No architecture rewrite is required to address the listed finite corpus gaps.

## Current submission files: fresh checks

The active exported bundle is `snap-412366cbb46f`, previous `snap-495f3f21cc8b`. Continuation checks compare the three submission files with CSV IDs, pinned source documents and current evaluator results:

- 53 rules, 53 unique IDs, 53 exact headline quotes at their recorded pinned-source offsets; all pass independent Draft 2020-12 validation.
- All 500 sample address IDs present, with valid result enums and references to existing rule IDs.
- Active lookup distribution: 3,381 applies; 289 superseded; 691 unknown; 140 not yet effective; 440 pending. Current working results match all active lookup labels.
- Change export contains T1–T5, not T6. T1 = 250; T2 = 90; T3 = 140 with 90 conflict flags; T4 = 110; T5 = 0. All affected/conflict IDs are supplied address IDs.

These are structural/count and replay checks, not independent judgments of every legal answer or exact organizer affected sets. The current 37-case reference replay has 32 correct definite answers, 4 correctly indeterminate answers and one overclaim (C35). Its 32/33 definite-answer agreement is not an organizer score or population legal-accuracy estimate. Some passing tests retain unverified modeled assumptions. The current validator repair changes the local engine hash; the active snapshot still records the prior committed engine. No publication occurred in this continuation.

Current checks: ignored `.cache/audit/continuation-boundary-results.json`, `continuation-schema-results.json` and `dataset-results.json`. Export SHA-256 values:

| File | SHA-256 |
| --- | --- |
| `rules.json` | `d8ac12ccac94f54a4079be9d0a428c0a3c7e13eeb224e0036671456b019db795` |
| `lookups.json` | `d4893d57e3ff136cdaae11cc0b29045cef5aee89eada4626649fe7c1cd7aeb79` |
| `changes.json` | `5a211b78bcfce3c9b2114880003a917560320fbb7b3654c870234dd3068c6686` |

## Where effort matters for judging

The following weights are **only the Desktop PDF's rubric**, not confirmed scoring rules for the no-scoring participant variant. No earned points can be computed from current evidence.

| Component | Desktop maximum | Highest-value improvement |
| --- | ---: | --- |
| Extraction accuracy | 25 | Correct dates/status/key values and omitted guards; reconcile Berkeley/LA versions; verify source-backed effects. Include Santa Ana extraction despite no sampled properties. |
| Address coverage | 20 | Correct legal city and material facts, preserve valid unknowns, remove unsupported certainty; distinguish a modeled event trigger from general protection coverage. |
| Citations | 15 | Preserve existing exact headline quotes and add clause/field-level provenance and enforced publication checks. |
| Change tracking | 15 | Assert exact T1–T5 sets and named before/after states, conflict IDs and individual proposal matching; perform actual T6 only if required and supplied. |
| Plain language/usability | 10 | A concise answer-first report with sources, date, strongest proved protection, missing fact and useful next step; verify mobile flows. |
| Responsible design | 10 | Correct uncertainty, genuine conflict review, hypothetical isolation and a traceable frozen bundle. A disclaimer alone is insufficient. |
| Scalability path | 5 | Demonstrate another document/jurisdiction through the same automated pipeline with measured limits and no hard-coded applicability. |

The first four components total 75 points in that rubric. The PDF says missed applicable rules cost twice as much as other address errors and unknown gets partial credit; it does not provide the exact formulas locally. That favors **source-faithful recall with honest uncertainty**. Comparing a consolidated rule count with a stated key total cannot identify omitted laws without provision-level matching and the actual key.

## Work needed before calling the submission sufficient

1. **Address remaining unsupported answers.** Resolve or quarantine C35 and source/version gaps. Validate or remove unverified exemption/CO/affordability assumptions. Keep the existing conflict, cutoff, correlation and zero-completion regressions; measure changed outcomes without targeting a lower unknown count.
2. **Establish clause-level support.** Retain exact executable clauses, exception/definition dependencies and field provenance, or quarantine incomplete compilation. Verify effects and penalties where required. Preserve existing snapshot/schema gates; add complete archival replay and source-entailment evidence.
3. **Independently verify Module C.** The shared dated path, reverse-date and proposal matching repairs are present. Assert exact T1–T5 sets, named before/after states, day-before/day/day-after boundaries and T3 conflict IDs against independent expectations. Exercise actual T6 only if the governing brief requires it and supplies an input; its document-ID path is implemented.
4. **Freeze one evaluated release and show the proof.** After repairs, run focused regressions, typecheck/build and relevant browser journeys; evaluate every supplied row; save failures, assumptions, conflicts, unknown causes and hashes. All surfaces claiming the published result should use that bundle. Preserve separate software, source-fidelity and fact-adequacy metrics. Show official scores only if an official scorer/key is provided and required.
5. **Complete the controlling delivery package.** The variant requires a live demo and one-page method note; a draft [METHOD_NOTE.md](METHOD_NOTE.md) is prepared. The Desktop brief additionally asks for a GitHub repo/live link and three videos with scores/T1–T6. Do not present the draft note, local app or missing score as evidence those external materials are already delivered.

These are prioritized gates, not a requirement to fix every low-priority audit item before a demo. Meaningful address/decision correctness, exact sources, stable release and usable demonstration take priority over broad historical coverage or speculative infrastructure. Bound historical answers explicitly if only the sample's tested dates can be supported.

## Demo that makes the solution convincing

Show a short, repeatable sequence from the frozen release:

1. A sample address with local/state layering: explain the jurisdiction, governing rule, source quote and date. Use an actual source-supported result rather than copying the PDF's illustrative output.
2. A missing-data case: show what is proved, what remains unknown and the one material fact needed. Demonstrate that a hypothetical answer does not modify actual evidence or the published release.
3. A change case: show before/after states and the exact affected cohort, such as the NJ future effective date and local conflict flags; show a pending MA scenario separately from actual law.
4. Source-to-record automation: show an extraction run or recorded reproducible run with exact quote validation. For a live rerun, make cache use explicit; a cached response proves replay, not fresh extraction. Use actual T6 only when supplied/required, or a clearly labeled optional new-document example.
5. End with the finite validation report and limits: checked rows, boundary cases, unresolved facts, identified source gaps and frozen bundle identity. Avoid a claim of 100% legal accuracy or a fabricated organizer score.

The credible distinction is evidence-backed answers and explicit reasoning boundaries at one address. A correct unknown with a useful explanation is more consistent with both briefs than a confident unsupported protection or obligation.

## Readiness gates

- [x] Central A/B/C capabilities and the three JSON outputs exist.
- [x] Current exports account for all 500 addresses and have 53 exact headline source spans and independent schema validation.
- [x] T1–T5 exported totals are consistent with the supplied cohort composition.
- [ ] Critical source/fact/uncertainty/change defects repaired and independently regressed.
- [ ] Complete field/effect/source support established or unsupported provisions quarantined.
- [x] Demonstrated snapshot overwrite/identity and publication schema defects have bounded repairs.
- [ ] Latest local code is frozen into a fully replayable evaluated release across CLI, website and exports.
- [ ] Legal county display and penalty coverage are addressed without violating official schema.
- [ ] Judge-accessible demo arrangement demonstrated.
- [x] One-page method-note draft prepared; review it after implementation repairs.
- [ ] Controlling brief established; any required GitHub/videos/score/T6 materials completed.

The initial review was read-only; later authorized repairs and author commit `4f2681c` advanced the implementation and published the current bundle. This continuation verifies that bundle and adds two local validator repairs without extraction, publication, deployment or external messages. Earlier unchanged-export statements describe the earlier review pass only. [AUDIT.md](AUDIT.md#continuation-verification-current-status) records current scopes and counts. Source completeness, unsupported assumptions, historical versions, independent review, complete release replay and judge-accessible delivery remain gaps. Winning also depends on other submissions and judges; this evidence establishes engineering readiness gaps, not a competitive probability.

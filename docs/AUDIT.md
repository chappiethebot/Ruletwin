# RuleTwin repository audit

Audited 2026-10-04 against commit `4f2e38a` and the existing working tree. Scope: first-party application, engine, CLI pipeline, evidence adapters, tests, configuration, documentation, and generated artifact consistency. Ponytail supplied the complexity review; Caveman supplied concise repository exploration guidance. This is an engineering audit, not an independent legal review or an organizer score.

## Continuation verification: current status

Continued 2026-10-04 after implementation commit `4f2681c`. That commit includes the earlier focused repairs and additional author repairs, and publishes `snap-412366cbb46f` (previous `snap-495f3f21cc8b`). The earlier 680-working/704-published totals and 31/38-test results below are historical. This section supersedes them for the current repository. This continuation does not rerun extraction/enrichment, alter supplied data/tests, publish, deploy or commit.

Two additional boundary defects were reproduced and repaired:

| Finding | Observed before | Current bounded repair and proof |
| --- | --- | --- |
| F04 official-schema gate | A string confidence and string overrides passed publication validation. Types, array items and numeric bounds were not enforced. | The gate now enforces the constraints used by the supplied schema. Regression rejects malformed confidence, NaN/infinity, out-of-range numbers, array items, flags and object/array confusion, while accepting allowed null/object values. Independent Draft 2020-12 validation passes all 53 current official records. This does not prove semantic source fidelity. |
| F02/F15 calendar validation | `2026-13-01` threw `RangeError` rather than returning false/rejecting evidence; it could crash an as-of query. | The shared date predicate checks parse validity before ISO conversion. Regression covers invalid month/day and leap-year boundaries, property CO values and validity bounds. Invalid property/change query URLs return 200 with the existing fallback behavior. |

Both new regressions failed before the repair and pass after it. **Final verification:** 50/50 tests, zero skipped; typecheck; full `npx eslint scripts src`; production build; 16/16 browser journeys at 1440px and 390px; publish dry run. A temporary production server on port 3097 was stopped afterward. Browser QA creates test accounts/saves in ignored local SQLite. Verification used Node 25.9.0; Node 24 compatibility, complete visual/accessibility coverage and release concurrency were not established.

| Current dataset check at 2026-10-01 | Result |
| --- | --- |
| Active rules/properties/evidence | 53 / 500 / 308; evidence status 196 validated, 112 inconclusive, zero duplicate IDs or revalidation changes |
| Working population | 26,500 pairs: 3,381 applies, 289 superseded, 691 unknown, 140 future, 440 pending, 21,559 not applicable |
| Unknowns | 691 rule/address results on 339 properties; 581 clarification questions; zero enumeration-limit properties |
| Active exports versus current evaluator | Zero result mismatches; the published and working default-date totals now agree |
| Baseline before enrichment | 751 unknowns on 342 properties; constraint-only result labels remain the same, with 598 questions |
| Raw data | All 500 CSV rows match the independent Python parser; 500 unique IDs; 17 first-party JSON files parse without errors |
| Extraction bookkeeping | All 89 dispositions accounted for, processed text hashes match; 77 candidate headline quotes and 53 active headline quotes/offsets exact |
| Field-level source gaps | 35 condition-atom quotes and 25 exemption quotes are not exact raw substrings; canonical recovery is insufficient for complete field provenance (F20) |
| Geography | A0346 remains unresolved after enrichment; ZIP-only evidence does not prove San Diego incorporation |
| Change cases | T1–T5 totals 250/90/140/110/0; T3 has 90 conflict flags. T4 proposal aliases have individual regression coverage. Actual T6 and organizer gold/scoring were not exercised. |
| Reference replay | Matches all saved case outcomes: 32 correct definite, 4 correctly indeterminate, 1 overclaim (C35). Small AI-authored 37-case set, not independent legal accuracy. |
| Masking replay | 151 properties, 149 questions/resolved cases, 2 unanswerable intervals; agreement with the full-data run over 7,567 definite results. This tests self-consistency, not legal truth. |

Encountered missing-field memberships: CO 394, other 558, owner type 331, owner occupancy 319, year 28. Reported decisive memberships: CO 394, other 376, owner type 160, owner occupancy 8, uncertain property identity 3. These overlap, are rule/address memberships rather than property counts, and depend on the modeled assumptions. The earlier decisive CO count of 406 applies to the prior bundle. Turning off only presumed exemptions changes 692 raw-evaluator outcomes across 412 properties; that sensitivity is not a fully evidence-only legal result set.

**Claude-response verification:** A fresh full pipeline dry run with `STRICT_EXEMPTIONS=1` reproduces **1,395 unknowns**, with **one enumeration-limit property (A0346)** and 15 limit-marked evaluations. This differs from toggling flags on already-consolidated rules and from earlier-bundle sensitivity experiments. Strict exemption handling still retains CO/affordability/shorthand assumptions, so it is not a complete evidence-only policy. Default mode still has zero limit properties. Saved diagnostics: `.cache/audit/claude-response-strict.json` and `claude-response-default.json`.

The response's claim of **18 constraint-resolved results** is reproducible against the raw evaluator with the same enriched inputs: all 18 are A0346 city-rule results changing from `unknown` to `not_applicable`, rather than 18 new positive coverage determinations. The default resolver reports 36 evaluations with method `constraints`, which is a different statistic. These are within-model conclusions, not independently verified jurisdiction/legality. The response's 48-test count is historical; current tests number 50. Its "every quote exact" assertion must be limited to headline quotes; the field-support gaps above remain.

The active bundle records engine hash `7258b7447a217b15f1a7f036c8c7fe01c295c1cfbed3f0730e4a8c0a5747d621`. It matched the committed engine at the start of this continuation. The local validator repair changes the engine hash to `8588945c42ca16fc902c9ea253ac5799b4a7d1019fb6eb04906d6b66e3604534`. No new snapshot was published; valid-data output parity does not make those code identities interchangeable.

Current export SHA-256 values are recorded in [SUBMISSION_READINESS.md](SUBMISSION_READINESS.md#current-submission-files-fresh-checks). Local evidence is in ignored `.cache/audit/continuation-boundary-before.json`, `continuation-boundary-results.json`, `continuation-schema-results.json`, `continuation-http-results.json`, `continuation-dataset-console.json`, `continuation-ledger-console.json` and `continuation-measure-console.json`; diagnostic scripts are not submission artifacts.

**Remaining priority:** F08's unverified CO lag, F17 exemption/affordability assumptions, F18 missing sections/definitions, F19 historical versions and C35, F20 field provenance, F21 effects/penalties, F22 independent review, F23 complete offline replay and F24 pinned extraction identity/vintage. F16 keyboard accessibility remains open. The third-pass table records bounded repairs, not certification of all adversarial inputs, all source clauses or legal answers. F01/F04 now address the demonstrated identity/overwrite and validation defects, but full archival replay and semantic publication assurance remain unproved. Correctness is improved; 100% legal reliability and complete recovery of missing facts are not established.

## Original assessment (historical)

The project is a working local application, not a scaffold. Address search, dated reports, source drawers, rule filters, local accounts, private saves, and conditional clarification work in browser tests. The deterministic engine is shared by the website and CLI, and the current published lookups agree with website evaluation on all 500 properties.

The largest risks are in provenance and uncertainty handling: snapshots can be overwritten under the same ID, legal evidence lacks adequate validation and conflict handling, disputed legal dates can produce an unjustified definite answer, and untestable exemptions are assumed false. Historical version/effect coverage and field-level source proof are incomplete. The change engine also misses losses of coverage. Passing tests do not cover these failure modes.

The original audit and research reviews were read-only. The final cross-check below applies focused repairs to F09, F12, F25 and F29 and updates the setup/continuity issues in F14. Existing user changes were preserved. No extracted rules, starter files, organizer tests, official exports or active pointer were changed. Earlier measurements and failure descriptions are retained as historical evidence; the latest status is below.

## Final cross-check and applied repairs

Historical pass before commit `4f2681c`; use the continuation section above for the current release, counts and tests. Statements below about unchanged exports/pointer apply only to this earlier pass.

Rechecked 2026-10-04 after the user authorized optional implementation changes. This remains an engineering verification, not independent legal certification. The 29 finding IDs are retained; F09, F12, F14, F25 and F29 have the bounded repairs described here. Other findings remain open.

| Item | Implemented repair and proof |
| --- | --- |
| F29 joint conditional branches | `Branch.when` is now a disjunction of conjunctions (`string[][]`). Compress a branch to marginal conditions only when they select exactly its admissible completion set; otherwise retain joint tuples. The website renders AND/OR groups and expandable complete alternatives. Independent Boolean truth-table tests check XOR, OR and AND, selecting exactly one correct branch for all four assignments each. |
| F09 contradictory/proof cases | Zero admissible completions produce `review_required`, unknown, no established statement, no branches and an explicit review action. Correlated questions can be identified by differing conditional outcome sets; irrelevance needs a valid complete comparison or a constant result. A correlated property-type/unit fixture and contradictory duplex/three-unit fixture fail before repair and pass afterward. These proofs are within the encoded domain, not proof that its assumptions match law. |
| F25 material property conflicts | Conflicting validated unit/year/CO claims invalidate the retained scalar fact, preserve records and add ignored/conflict reasons. A conflicting year also invalidates a derived CO bound while preserving independent CO evidence. Municipality conflicts retain alternatives with unresolved legal city. Tests cover original known values, input immutability, record ordering and candidate filtering. The original 2/20-unit probe now returns unknown instead of applies. Evidence-validation/authority weaknesses remain F02/F05. |
| F12 environment initialization | Shared config loads `.env.local` before deriving `STARTER_DIR`; explicit shell variables remain authoritative. A subprocess test uses a separate fixture directory and quoted path with spaces. It failed before the one-line initialization repair and passes after it. |
| F14 setup/continuity | README and handoff now distinguish working versus active inputs, real verification from legal accuracy, current evidence/status and the two challenge variants. Optional enrichment prerequisites and measurement commands are documented. The dead `npm run changes` script was removed; tests now include `scripts/config.test.ts`. |

**Final gates:** `npm test` **38/38**; typecheck pass; lint of changed TypeScript/TSX files pass; production build pass; browser suite **16/16** at 1440px and 390px using a temporary production server on port 3097; publish **dry run** pass. The temporary server was stopped; the pre-existing port-3000 process was preserved. Browser QA created test data in ignored local SQLite. Build/browser checks exercised the engine/UI repairs; the subsequent CLI initialization/script change has its own subprocess, typecheck and full-unit verification.

**Dataset facts rechecked:** 16 first-party JSON files parse; all 500 CSV rows agree with the independent parser; 89 ledger dispositions and processed text hashes match; 77 candidate headline quotes and 54 active headline quotes remain exact; active lookup results have zero mismatches with the repaired evaluator. Working results remain 680 unknowns across 339 properties, 27,000 pairs and no enumeration limits. Active export remains 704 unknowns. The strict-exemption sensitivity remains 1,374 unknowns across 499 properties. These totals preserve the still-unrepaired CO, affordability and exemption assumptions and are not corrected legal truth.

Reported decisive CO memberships change from **394 to 406**, reflecting the additional correlated dependency detection; encountered CO memberships remain 394. Other reported memberships remain other 372, owner type 160, occupancy 8 and year 30. This is a dependency statistic, not 12 newly recovered CO facts or 12 resolved unknowns. Total working questions remain 586. Replayed reference results and the 151-property masking experiment reproduce the saved values and limitations.

The Desktop PDF and public participant PDF retain the previously recorded hashes; the public dev folder still lists only `change_tests.json`. Their conflicting scoring/T6/delivery requirements remain unresolved. All seven cited arXiv abstract pages and the XACML repository abstract were opened again and match the stated topics. This verifies references and method-level relevance, not experiments, legal authority or RuleTwin accuracy. Primary source links are retained in the research documents.

Final selected nine-file code hash: `4e991ee2d6b750d26ed5852cd80654472fa5cac563318080a2c1d1b63684e650`; it is a diagnostic hash, not a complete release identity. The three official export hashes match [SUBMISSION_READINESS.md](SUBMISSION_READINESS.md). Local before/after and source evidence are saved in ignored `.cache/audit/final-before-results.json`, `final-after-results.json`, `final-after-strategy.json`, `final-source-checks.json`, plus the refreshed dataset/measurement replays. No publication, paid extraction, new property enrichment or deployment occurred.

## Repair status, third pass (2026-10-04, after commit `4f2e38a`)

Applied by the implementation author after reading this audit. Findings text above is unchanged; this table records current status. Verification: 48/48 unit tests (new `src/lib/engine/audit-regressions.test.ts`, `scripts/publish.test.ts`), typecheck, lint, build, 16/16 browser journeys, publish of `snap-412366cbb46f` through the new gates.

| Finding | Status | What changed |
| --- | --- | --- |
| F01 snapshot identity | Repaired | Id = hash of rules, facts, evidence, tests, ledger, cited source-text hashes, engine source hash and exemption policy. Existing bundles are never overwritten (identical content = no-op; different content under the same id = refusal). Bundle is staged then renamed; `previous` never points at itself. |
| F02 legal evidence | Repaired | Status enum, real calendar dates, law-level subject, exact match and validity order are validated; legal records are re-validated at use; disagreeing records produce a dispute (no first-record winner), set `conflict_flag` and become `disputed_effective_dates`. |
| F03 disputed dates | Repaired | A dispute whose alternatives straddle the query date forces resolution even when the chosen date is definite (regression: 2025/2027 at 2026 stays unknown). |
| F04 publish gates | Repaired | Official schema, exact quote at recorded offsets, unique property/rule ids, extraction-error ledger (override `ALLOW_PARTIAL=1`) and evidence re-validation are enforced before anything is written; fail-closed test. |
| F05 identity promotion | Repaired (bounded) | NJ: exact house number + street required, and every listed address must agree. ZCTA single-candidate promotion only when street-in-ZIP is corroborated; otherwise "another municipality" remains (A0346 now ambiguous). LADBS still inconclusive for all sample rows. |
| F06 change tracking | Repaired | Any result change in either direction counts (coverage loss included); reports and changes share one dated evidence + resolver path; reverse-date regression. |
| F07 SDMC anchoring | Repaired | History note must lie within the cited section's span; otherwise nothing is claimed (now 1 rule receives SDMC evidence instead of 2). |
| F08 CO bound | Partly repaired (policy) | Bound is now `presumed` (disclosed in every result it decides) and never rejects an observed CO record. The one-year bound is kept because the organizers' README treats only the cutoff year as unknown and the brief's sample output infers the CO cutoff from year built. |
| F10 T6 doc id | Repaired | One `DOC_ID` contract in extraction and loading (`T6A` valid). |
| F11 failed reruns | Repaired | Prior accepted candidates are retained when a document's rerun fails. |
| F13 known extraction errors | Mostly repaired | C08: year-built cutoffs keep day precision from their own quote. C34: non-bill laws merge legislative stages (pending→enacted) with disclosure. C35 remains: the March 1, 2026 Berkeley date is not present in the corpus copy of D001. |
| F15 malformed input | Repaired | Real calendar dates for queries; clarification answers must equal an offered option. |
| F17 untestable exemptions | Policy made explicit | Default keeps disclosed presumptions (matches the brief's illustrative output); `STRICT_EXEMPTIONS=1` publishes the evidence-only variant. Snapshot records the policy. |
| F26 numeric contract | Repaired | Digits-only years/units, year ≤ record capture year; raw strings kept. |
| F27 NJ shorthand | Repaired | `nU` counts are `presumed`, class 4C stays a known [5, ∞) range. |
| F28 proposal aliases | Repaired | P1/P2 map to the n-th bill named in the test title; ambiguity is reported. T5 now matches only the failed ballot measure. |
| Ponytail deletions | Partly applied | Unused `rsoImplications` removed. |
| F16, F18, F19, F20, F21, F22, F23, F24 | Open | See findings above; no change in this pass. |

## What was implemented at the original audit

| Area | Implementation | Assessment |
| --- | --- | --- |
| Source ingestion | `scripts/extract.ts`: manifest inventory, supplemental and extra documents, API or Claude CLI transport, chunking, response cache, bounded repair, candidates and ledger | Real automated extraction; validation and recovery need strengthening |
| Geography | `scripts/geocode.ts`, `publish.ts:loadProperties`: Census cache, formatting variants, house-number checks, incorporated-place selection | Postal city is not directly treated as legal city; alternate adapters introduce weaker evidence paths |
| Facts | `src/lib/engine/facts.ts`: CSV parsing, assessor year, unit intervals, property type, missing ownership, disclosed affordability presumption | Explicit uncertainty; CO bound is an additional assumption |
| Applicability | `engine.ts`: Strong Kleene operators, interval comparisons, rolling cutoffs, proposal/failed/future states, jurisdiction, precedence, trace | Small and understandable; no generated code execution |
| Resolution | `resolve.ts`: partition unknown domains, enumerate up to 4,096 combinations per category, identify decisive questions, hypothetical answers | Useful conditional layer; proof claims need edge-case checks |
| Evidence | `evidence.ts`, `scripts/evidence/adapters.ts`, `scripts/enrich.ts`: cached retrieval, record validation, property overlays, legal history, reviewed imports | Functional, but record validation does not establish all claimed provenance properties |
| Publication | `scripts/publish.ts`: consolidation, all-property evaluation, official exports, source copies, active pointer | Successful dry run; immutability and publish gates incomplete |
| Web | App Router pages, server actions, native dialog, search, rule filters, change tables | Working desktop/mobile journeys; some accessibility and artifact-consistency gaps |
| Accounts | `db.ts`, `auth.ts`, `actions.ts`: SQLite, salted scrypt, hashed session tokens, server-side authorization | Appropriate to the documented local demo; owner-scoped queries pass tests |
| Evaluation | `scripts/measure.ts`, `data/reference/`, `docs/EVALUATION.md` | Useful internal comparison; hand-picked AI-authored reference set is not independent ground truth |

Local-only hosting, SQLite, native Node tests, and Edge/CDP are documented decisions. They supersede the original brief's hosted Supabase/Vercel and Vitest/Playwright defaults; they are not missing features merely because the old brief requested them.

## Original state and verification (historical)

At the original audit, the handoff was stale: it named `snap-bd757b1fd1fa` and 15 unit tests. The final cross-check refreshes it. The active pointer still names `snap-495f3f21cc8b`, with `snap-bd757b1fd1fa` as previous. The table below preserves original audit results; use the final section above for the repaired code's 38-test result.

- Current active bundle: 54 rules, 500 properties, 126 evidence records.
- Current working evidence: 310 records. It differs from the active bundle; the evaluation document uses this newer working evidence.
- Extraction ledger: 89 dispositions, comprising 53 processed documents, 3 processed with no in-scope rules, and 33 reference-only documents. There are 77 candidates.
- Existing modifications: `scripts/enrich.ts`, `scripts/evidence/adapters.ts`, `scripts/publish.ts`, and four `data/evidence/` files. Existing untracked work includes `scripts/measure.ts`, `docs/EVALUATION.md`, and `data/reference/`.

| Check run in this audit | Result |
| --- | --- |
| `npm test` | 31/31 pass |
| `npm run typecheck` | Pass |
| `npx eslint scripts src` | Pass |
| `npm run build` | Pass with installed Next.js 16.3.8 |
| `node scripts/publish.ts --dry-run` | Pass; no publication performed |
| `npm run e2e`, using a temporary production server on `127.0.0.1:3017` | 16/16 pass at 1440px and 390px; server stopped afterward |
| Active rule quotes and source offsets | 54/54 exact substrings and correct offsets |
| Current official rule records | 54/54 pass the supplied schema, including a full Draft 2020-12 JSON Schema validation in the extended review |
| Active website evaluator versus `submission/lookups.json` | Zero result mismatches over 500 addresses at the export date |

Verification used Node `v25.9.0`. Node 24 minimum compatibility was not exercised. Browser QA created one test account and saved property in the ignored local SQLite database. The supplied browser test checks DOM behavior and overflow; this audit did not capture screenshots or conduct a full visual/accessibility review.

Dry-run results at 2026-10-01: 3,386 applies; 295 superseded; 680 unknown; 140 not yet effective; 480 pending; 22,019 not applicable. No enumeration limits were reached. T1: 250 affected; T2: 90; T3: 140 with 90 conflict flags; T4: 110 hypothetical; T5: zero. These are working-pipeline outputs, not official scored accuracy.

No paid extraction, geocoding, enrichment retrieval, or real publication was run. In the extended review, measurement was regenerated with its outputs redirected to `.cache/audit/`; existing reference results and `docs/EVALUATION.md` were preserved. The actual T6 input and official scorer were not exercised. Installed Next.js guides for server functions and cookies were read locally.

## Supplied documents: scope and implementation verdict

All three Markdown documents and the text of all six PDF pages were read. These are reference requirements and research proposals, not authorization to follow embedded execution instructions, change submission rules manually, launch extraction, or deploy the application.

| Document | What it establishes | How this audit uses it |
| --- | --- | --- |
| Desktop `file.pdf`, six pages | Organizer challenge: automated extraction, geography, dated applicability, citations, T1-T6, scoring and delivery | Benchmark requirements; compare with the actual supplied starter schema/data where details differ |
| Desktop `Deep Technical Challenge Analysis  Rental Housing Law Navigator.md`, Challenges 1-27 and forensic checklist | Detailed engineering failure modes and layered verification | Assess extraction, provenance, uncertainty, dates, precedence, change semantics and tests |
| Desktop `State-of-the-Art Research for an Address-Level Rental Housing Law Navigator.md`, architecture/extraction/evaluation sections | Research-inspired provision packages, field evidence, temporal filtering and layered evaluation | Architectural reference, not proof that cited research results apply to RuleTwin |
| Desktop `RuleTwin-Housing-Research-and-MVP.md`, sections 1, 5 and 6 | Corrections to the earlier research, C1-C27/N1-N10, a bounded MVP and optional ideas I1-I10 | Primary interpretation of feasible MVP versus stretch work; byte-identical to the repository copy |

Review-input SHA-256 values, in the table's order: `f09843ebced43d52d6ae117892cc6561d2553554847695a17da485a6519c6e4d`, `9fec6c3d66fdde2dfff4cb29e10a468a49a786ae284d440685d807717bbc9215`, `27a936fdc4aa51adf8d1b6ff1f210fefafa8eef738e33f26bd939a7d76039295`, and `6f022bb4ce630807b32e55b9fe879d3444359fc5ef71e820ea49f835117add42`.

**Verdict: substantially implemented, but only partially verified and with material correctness gaps.** The small shared deterministic engine, automatic extraction, exact headline source spans, explicit missingness, source drawers and local demo are appropriate implementations. The documents' stronger claims about complete legal coverage, conservative uncertainty, time-correct versions, field-level proof and independent accuracy are not established. A passing build and successful execution on every address do not establish these properties.

The MVP document explicitly warns that the earlier research bibliography has mismatched references. No research-paper percentage is counted as a RuleTwin result, and the linked papers were not independently revalidated in this audit. A vector database, graph database, general SMT solver, multi-agent extraction ensemble, hosted account provider or full legal ontology is not required to repair the identified MVP defects.

### Requirement traceability: C1-C27

"Partial" means working support exists but the stated assurance or relevant edge case is missing. "Present" describes implementation, not independent legal certification.

| Challenge | Status | Implementation and remaining gap |
| --- | --- | --- |
| C1 source integrity | Partial | Ledger text hashes and snapshot source copies match; full immutable identity and publish validation missing (F01/F04) |
| C2 structural segmentation | Partial | Paragraph chunking; no section hierarchy, scope inheritance or cross-reference closure (F18) |
| C3 rule identity/version | Partial | Stable grouping/IDs and snapshot history; status-split duplicate provisions and no explicit concept/version lineage (F13/F19) |
| C4 operative language/actor | Partial | Requirement text and category extraction; no structured actor/modality/penalty verification (F21) |
| C5 Boolean scope | Partial | CNF conditions, AND exemptions and Kleene operators; exemption defaults and no verified clause-to-expression mapping (F17/F18/F21) |
| C6 scoped definitions | Gap | No definition symbol table, section scope or dated definition dependencies; model must infer them (F18) |
| C7 numeric effects/formulas | Partial | Free-text requirement/key value plus typed predicate comparisons; no typed amount/unit/formula or guarded-effect evaluator (F21) |
| C8 legal time | Partial | Start dates, partial precision, rolling years, pending/failed/future; no sunset/end interval or reliable version history (F02/F03/F19) |
| C9 citation sufficiency | Partial | All headline spans verified; no complete field-specific source/span map or semantic entailment test (F20) |
| C10 geography | Partial | Census incorporated place, cached matching and candidate alternatives; weaker enrichment identities and no independently audited boundary/vintage accuracy (F05) |
| C11 property data | Partial | Missing facts, intervals and no inferred owners; unsupported CO bounds and affordability presumption (F08/F17) |
| C12 three-valued logic | Partial | Core truth tables present; some exemptions explicitly convert unknown to false, and zero-completion/dispute defects remain (F03/F09/F17) |
| C13 precedence | Partial | Explicit yields/conflict flags; broad same-category local matching instead of source-backed provision relationships (F13) |
| C14 negative findings | Partial | Failed measures do not apply; corpus disposition is not proof that no applicable law exists; independent negative coverage key unavailable |
| C15 change tracking | Partial | T1-T5 and custom dates; coverage losses, guarded effect changes and aligned temporal evidence incomplete (F06/F19/F21) |
| C16 retrieval recall | Appropriate MVP / partial assurance | Available corpus text is processed exhaustively, avoiding a top-k bottleneck; referenced/definition text and section completeness still unproven (F18) |
| C17 LLM variability | Partial | Structured output, caching and bounded repair; no measured repeatability/semantic verifier, mutable model identity and incomplete cache versioning (F20/F22/F24) |
| C18 prompt injection | Unverified | Prompt separation and constrained extraction exist; no adversarial document/end-to-end injection suite (F22) |
| C19 safe compilation | Partial | Allowlisted fields/operators and deterministic interpretation, no generated executable rules; runtime semantic/value checks incomplete (F04/F15/F21) |
| C20 official serialization | Present for current rules | All 54 exported records pass supplied JSON Schema; this is not a complete internal-logic or future publish gate (F04) |
| C21 explanations | Present / partial assurance | Trace-based templates, uncertainty and disclosed assumptions; completeness and certainty can inherit engine defects (F03/F09/F17) |
| C22 evaluation | Partial | Unit/browser/reference/masking checks; no independent gold, complete boundary/mutation/invariance suite or official scorer (F22) |
| C23 observability | Partial | Ledgers, evidence outcomes, latency and review notes; recovery can discard accepted work, and no comprehensive semantic failure gate (F11/F20) |
| C24 performance/cache | Present for local MVP | Small corpus, cached extraction, bounded enumeration and precomputed snapshots; no production load/concurrency proof |
| C25 reproducibility | Partial | Saved inputs and repeatable measurements; mutable aliases, partial run identity and snapshot overwrite risk (F01/F24) |
| C26 demo/degradation | Partial | Local desktop/mobile flows pass; actual T6, hosted delivery, videos and corrupt-artifact recovery unverified (F10/F16) |
| C27 responsible delivery | Partial | Information-only framing, missing facts and source access; conservative decisions can still overclaim (F08/F13/F17) |

### Additional MVP requirements: N1-N10 and optional ideas

| Requirement from MVP section 1 | Assessment |
| --- | --- |
| N1 valid/transaction time and transaction facts | Snapshot time and property-evidence validity exist; no complete bitemporal legal selection or structured tenancy/transaction context (F02/F19/F21) |
| N2 amendment patch lineage | Gap: snapshots/dedup are not provision-level amend/repeal lineage (F19) |
| N3 contradictions, cycles and version conflicts | Partial: date/local conflict support; first-record choice, definite-date bypass and no general contradiction/cycle validation (F02/F03/F09) |
| N4 recursive exceptions/alternative effects | Partial: many Boolean formulas can be represented in CNF; original nested scope, counterexceptions and guarded alternative effects are not preserved/proved (F18/F21) |
| N5 effect completeness separate from coverage | Gap: proving a rule applies does not prove its amount, timing, exceptions or remedies are complete (F21) |
| N6 misuse prevention | Partial: local account isolation and information-only wording; hypothetical clarification is not externally verified fact, and overclaims remain |
| N7 authority/integrity/semantics/completeness | Partial: source types/hashes/review metadata; `validated` is weaker than all four assurances (F02/F20/F22) |
| N8 safe source rendering/uploads | Ordinary text rendering and no general arbitrary upload UI reduce exposure; actual new-document injection and malformed-source paths remain untested (F10/F22) |
| N9 benchmark truth versus actual law | Explicitly separated in this audit and reference metadata; no organizer score or counsel-reviewed legal accuracy available |
| N10 T6 release | Prepared CLI path; actual fictional ordinance absent, ID/source loading defect present, release not demonstrated (F10) |

For section 6 ideas: I2 useful-fact questions is implemented, but is not a proven minimum-cardinality optimizer. I3 change explanations and I4 definite/possible impact are partial, with F06 still blocking reliable loss detection. I8 jurisdiction alternatives exists, with source quality limitations in F05. I9 receipt is partial (F23), and I10 is a document ledger rather than section/exception completeness (F18). I1 exception witnesses, I5 correction replay, I6 amendment merge preview and I7 extraction invariance are not demonstrated. Several are explicitly stretch work; their absence alone is not a blocker. The underlying invariance, conservative uncertainty and replay-integrity checks are still useful MVP verification.

### Organizer PDF versus the actual local pack

The PDF calls for state/county/city location, penalty information, T1-T6, a scored dev/held-out evaluation and event delivery including a live link and videos. Current rule levels are state/city only; county is not a first-class applicability tier or report output. Penalties are not a structured extraction field. The supplied official rule schema itself has no penalty field, so this is a brief-level coverage gap, not one of the 54 records failing that schema. No sampled county-level rule was independently found missing by this audit.

The actual local no-scoring pack provides neither the promised dev answer labels/scorer nor the hour-16 T6 ordinance. The PDF's stated key contains 58 rules and 19 negative findings, only 52 rules verified, with no counsel review. Comparing that number to 54 consolidated RuleTwin rules cannot identify "four missing laws": granularity, negative-record treatment and key availability differ. No exact precision/recall or organizer score can be derived from those totals. The published scoring weights (extraction 25%, addresses 20%, citations 15%, changes 15%, usability 10%, responsible design 10%, scale 5%) describe the event, not measured results here.

Local-only operation is an accepted repository decision, but it does not demonstrate the Desktop PDF's event delivery requirements. Actual held-out scoring, T6, hosted availability and three demo videos remain unverified for that brief. They are conditional requirements because the linked participant variant below differs. This audit does not authorize deploying or fabricating absent organizer inputs.

### Challenge-fit review: a second linked brief changes the delivery scope

The subsequent readiness review followed the Desktop PDF's public Google Drive link and read the six-page `mit-rental-housing-law-navigator-challenge-v5-participant-no-scoring-no-hour16.pdf` in that folder. SHA-256: `ba3ebc46abf2711aa24e345d7ab0a17920672262bcc83eaaf838c427f25982fb`. Its Module C explicitly requires five supplied tests, with no surprise document or mid-event release; its submission package asks for the three JSON outputs, a live demo and one-page method note. It does not specify the Desktop brief's scoring rubric, score-report videos or T6. The visible public dev folder contains only `change_tests.json`, consistent with the local pack. This is a material difference between the two available briefs, not proof that one supersedes the other.

Accordingly, missing scorer/T6/videos are not unconditional implementation blockers under the no-scoring participant variant. The controlling event requirements need organizer confirmation. The demonstrated source, uncertainty, evidence, change and snapshot defects remain relevant under both versions. The original PDF's weights and minimum-entry description above are attributed to that PDF only. The actual T6-ID bug F10 remains a real pathway defect if the task is used, but its necessity for entry depends on the controlling brief.

A fresh export inspection confirms 54 unique rules, 54 headline quotes exactly in their named pinned source files, all 500 CSV IDs present in lookups, valid result enums/rule references, T1-T5 totals 250/90/140/110/0 and 90 T3 conflict flags. The active snapshot remains `snap-495f3f21cc8b`, with 704 unknowns; these are structural/count checks, not new independent legal scoring. No Git origin is configured; external repository publication and demo access are not evidenced by the local files. Existing user changes were preserved.

[SUBMISSION_READINESS.md](SUBMISSION_READINESS.md) maps both briefs to implementation, separates the conditional score/delivery requirements, ranks competitive priorities and defines a bounded demo sequence. A draft [METHOD_NOTE.md](METHOD_NOTE.md) addresses the participant variant's method-note deliverable with explicit current limitations. These are review artifacts, not proof that product repairs or external submission have occurred. No new numbered code finding is added by this requirement-version check.

## What `unknown` means

`unknown` means **the available evidence cannot decide whether this particular rule covers this particular property on this particular date**. It is not a probability, a system crash, a statement that there is no law, or a guarantee that the rule does not apply. It is an intended answer in both the supplied challenge and the design documents.

The core uses Strong Kleene logic: true AND unknown is unknown; false AND unknown is false; true OR unknown is true; false OR unknown is unknown; NOT unknown is unknown. Thus a missing owner fact should not stop rejecting an out-of-state rule, but it should stop a definite decision when owner occupancy is a decisive exemption.

Examples from current data:

- `A0001`, rule `r-6fae6c`: whether the unit is a Protected Unit being demolished for new construction is not in the property data. That predicate uses field `other`; coverage remains unknown.
- `A0003`, rule `r-b0e375`: the relevant completion/CO timing is unavailable. A build year is not an exact occupancy certificate.
- `A0005`, rule `r-16e87d`: the current resolver identifies CO timing as a decisive question. Its alternatives distinguish dates on either side of the compiled threshold; that explains the implementation, not independent confirmation of the legal cutoff.

Other uncertainty kinds include missing location, missing legal version/date, disputed legal interpretations and unsupported predicates. `pending`, `not_yet_effective` and `superseded` are separate statuses/results: a pending bill must not become law just because a projected date passes. A failed measure returns not applicable rather than an invented live rule.

`missing_facts` lists encountered missing inputs, which can include inputs that no longer decide the result because another branch resolves it. Clarification questions try to isolate decisive inputs and partition possible answers. They are hypothetical until supported by evidence; branch counts are not probabilities. `exhaustive` means enumerated over the **implemented** admissible domains, not exhaustive knowledge of the law or the real property.

There is a material policy exception: publication marks some untestable exemptions `presumed_inapplicable`, and the engine then converts unknown exemption truth to false. It also presumes affordable restriction false for 474 properties, and treats a one-year CO bound as known. These choices can suppress unknowns without obtaining evidence. They are disclosed in code/explanations, but disclosure does not meet the documents' conservative unknown requirement (F08/F17).

### How many unknowns exist, and which dataset is being described?

Results below use default as-of `2026-10-01`. A count is a **rule/address result**, not a count of different laws or properties.

| Dataset/phase | Evidence records | Unknown results | Properties with at least one unknown | Clarification questions | Enumeration limits |
| --- | ---: | ---: | ---: | ---: | ---: |
| Base facts, raw Kleene evaluation | 0 | 741 | 342 | Not generated | Not used |
| Base facts plus constraint resolution | 0 | 741 | 342 | 605 | 1 property |
| Active published snapshot / official lookups | 126 | 704 | 341 | Not recounted here | Not recounted here |
| Working enrichment plus constraints | 310 | 680 | 339 | 586 | 0 |

The constraint layer initially changes the explanation/questions, not the 741 result labels. Working evidence reduces that to 680; the website currently loads the frozen active bundle, so its 704 unknowns should not be confused with the newer working evaluation. Publication was not run to make those datasets identical.

Working unknowns: 348 just-cause eviction, 252 rent-increase limits, 38 screening restrictions and 42 security deposits; by state, CA 472, NJ 114, MA 94. Missing-field memberships are `other` 552, CO 394, owner type 327, owner occupancy 315, build year 18. These memberships overlap and must not be added as independent unknown results. No unresolved unit field appears in these unknown outputs, although 32 properties still lack a normalized unit count.

## Dataset testing: method, outcome and limits

**All 500 rows and all 54 active rules were exercised. All possible legal interpretations, extraction omissions and input combinations were not checked.** Structural integrity, execution coverage, reproducibility and independent semantic/legal accuracy are different claims. There is no evidence supporting "every bit and byte is correct."

The extended checks ran offline against the current saved data. Audit helpers/results are in ignored `.cache/audit/`, including `check-datasets.ts`, `dataset-results.json`, `schema-results.json`, and redirected `measure-replay.json`. They are local verification evidence, not a new committed regression suite. PDF reading used temporary `pypdf` installation outside the repo; the default Python environment lacked that optional enrichment prerequisite.

### Structural and provenance checks

| Check and method | Observed outcome | What it does not prove |
| --- | --- | --- |
| Parse first-party data/submission JSON, excluding private `data/local` | 16/16 files parse; no errors | Runtime validity of every internal field |
| Parse starter CSV independently with Python `csv.DictReader` (`utf-8-sig`, newline-aware) and compare every row/field with Node parser | 500 rows, 500 unique IDs, zero field differences | Correct assessor records, ownership or legal applicability |
| Inventory sample states | CA 250, NJ 140, MA 110 | Independent geographic boundary truth |
| Inspect missingness before/after normalization | Build year missing 212 both times; units missing 242 raw versus 32 normalized | 210 unit values/intervals derived from use descriptions are not externally measured unit counts |
| Inspect year sentinels in supplied sample | No sampled `0`, `0000`, `9999`, `N/A`, `UNKNOWN` or future build years | Robustness to those values in other inputs; dedicated sentinel fixtures are absent |
| Manifest versus processing ledger | 89 entries = 87 starter + 2 supplementary; all have dispositions: 53 processed, 3 no rules, 33 reference-only | All legal sections, definitions and exceptions extracted, or all link-only text fetched |
| Rehash available processed text | All 56 text hashes match ledger | Independent byte-for-byte authentication of every original external/PDF document |
| Check every candidate headline quote/offset against its original available text | 77/77 candidates match exactly | Those quotes entail every extracted date, condition or exemption |
| Check pinned active sources against working source text | All 53 active cited source copies match | Uncited sections are fully covered |
| Check active headline spans | 54/54 exact substrings with correct offsets | Field-level evidence completeness; see F20 |
| Validate supplied official schema with Python `jsonschema.Draft202012Validator` | Submission 54, active 54, previous 54, older snapshot 50: zero rule-record errors | Internal logic correctness, legal recall, or automatic future publish rejection |
| Compare official rule fields and published lookup results with active snapshot/evaluator | Zero differences across all 54 rule records and 500 lookups | Accuracy against an external legal key |
| Revalidate working evidence using current validator | 310 unique IDs; 198 validated, 112 inconclusive, zero status changes | Independent source authenticity or correctness of the validator (F02/F05) |

All 500 cached geography rows exist. Base facts leave nine addresses unresolved: `A0009`, `A0098`, `A0128`, `A0168`, `A0295`, `A0346`, `A0376`, `A0380`, `A0384`. Working enrichment resolves all 500 into nine expected cohorts: Los Angeles 80, San Francisco 80, San Diego 50, Berkeley 40, Jersey City 50, Hoboken 40, Newark 50, Boston 60, Cambridge 50. That is a consistency check against the sample composition, not independent proof that ZIP/ZCTA or alternate address matches establish legal city (F05). Santa Ana appears in the extraction geography but has no sampled property cohort.

Of the 198 validated working records, 190 are assessor-roll checks, two NJGIN/boundary records, four San Diego legal-history records, and two ZCTA records. The 112 inconclusive records are 106 NJ year attempts and six LADBS CO attempts. Therefore the run did **not** obtain usable NJ year facts or actual LA CO dates from those attempted adapters. A request count or `validated` label must not be presented as 310 newly established facts.

### Population execution and uncertainty sensitivity

Evaluating 54 rules against 500 addresses executes 27,000 rule/address pairs. Working results total exactly 27,000: 3,386 applies, 295 superseded, 680 unknown, 140 future, 480 pending and 22,019 not applicable. Many are trivially outside jurisdiction; 27,000 executed pairs are not 27,000 independently judged legal conclusions.

The active export has 3,382 applies, 293 superseded, 704 unknown, 140 future and 481 pending; not-applicable rows are filtered from its official lookup representation. This explains why exported item counts differ from full population evaluation.

An offline sensitivity check disabled only `presumed_inapplicable` flags in memory, leaving the rest of the data unchanged. It changed 694 raw engine results across 414 properties and seven rules: **497 applies to unknown and 197 superseded to unknown**. This measures dependence on unsupported exemption assumptions, not 694 independently proven legal errors. Affordability defaults and CO assumptions were left in place, so it is not a complete conservative re-evaluation. See F17.

### Reference-case evaluation: what the accuracy number actually means

The repository has 37 curated cases, covering 19 distinct properties and all six categories, authored/reviewed by Claude. The metadata explicitly says they are not independent of the system author, not counsel reviewed and not the organizer key. The audit recomputed every case and independently matched the stored per-case verdicts with zero differences. A full redirected run of `scripts/measure.ts` also reproduced the saved previous-release, baseline, constraint, enrichment and masking results; its JSON differed only in generation timestamp.

| Phase | Cases | Correct definite | Correct indeterminate | Wrong definite | Overclaim | Conflicting outputs | Unresolved expected definite |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Previous release, available subset | 31 | 19 | 3 | 1 | 1 | 1 | 6 |
| Current base Kleene | 37 | 25 | 3 | 2 | 1 | 2 | 4 |
| Current constraints, no new evidence | 37 | 25 | 3 | 2 | 1 | 2 | 4 |
| Current working enrichment | 37 | 31 | 3 | 0 | 1 | 2 | 0 |

The reported definitive-answer accuracy is 19/21 = 90.5% for the previous subset, 25/28 = 89.3% for baseline/constraints, and 31/32 = 96.9% for working enrichment. The metric excludes conflicting multi-output cases from its answer denominator. Enriched definite-resolution coverage is also 31/32 = 96.9% by this scorer's definition. Neither number is overall 500-address legal accuracy or the organizer score. Across all 37 enriched cases, 34 receive a correct/correctly-indeterminate verdict and three remain problematic:

- C08 / `A0107`, Los Angeles build year 1978: reports applies where the reference expects indeterminate. This is the known cutoff-year overclaim.
- C34 and C35, Berkeley present/temporal cases: both enacted and pending outputs remain. This is a legal-version/consolidation problem, not two valid independent approvals.

### Mask-and-restore testing

The measurement script selects 151 CA properties with a known build year, hides that year and its derived CO proxy, asks the resolver's questions, then supplies answers from the original system facts. It asks 160 questions total (mean 1.06, maximum 2), restores the masked fields for all 151, and obtains 100% agreement on 8,034 compared definite outcomes. Zero oracle-unanswerable questions were observed.

This proves repeatable recovery/self-consistency for those masked fields and those implemented intervals. It does not establish actual CO dates, owner facts, omitted rules, independent legal correctness or resolution of every remaining property uncertainty. Many compared outcomes are irrelevant out-of-jurisdiction not-applicable results. The same fact construction supplies the oracle and engine, so an incorrect CO assumption can pass this test. The reported zero unanswered questions does not demonstrate that interval-straddling cases were successfully handled; none blocked this replay.

### T1-T5 and date boundaries

| Case | Recomputed result | Scope/limit |
| --- | --- | --- |
| T1 California future law | 250 affected, all definite | 2025-12-31 versus 2026-01-02; additional exact-day probe on 2026-01-01 yields applies for all 250 |
| T2 Hoboken/Jersey City | 90 affected = Hoboken 40 + Jersey City 50 | Newark excluded; no possible-impact rows |
| T3 NJ future rule | 140 affected, with 90 conflict flags | Exact 2027-07-01 start yields applies for all 140; conflict flags align with Hoboken/Jersey City |
| T4 Massachusetts proposal | 110 affected under hypothetical enactment | Does not establish that the proposal actually enacted; real status stays pending |
| T5 failed measure | Zero affected | Failed measure never applies |
| T6 Cambridge fictional ordinance | Not run | Organizer document absent; loader rejects the documented `T6A` shape (F10) |

These recomputations agree with the benchmark's broad narrative and current saved counts. The organizer's exact affected-address answer sets were unavailable. Only the listed start-day boundaries were added; this is not every threshold of every rule. The reverse-date loss probe fails (F06), and no general sunset/repeal/effect-change coverage is established.

### Remaining verification needed before claiming complete testing

1. Add focused regression cases for each confirmed defect, then require runtime schema/provenance/completeness gates before publishing.
2. Audit sections and referenced definitions, and have an independent reviewer judge omitted conditions, exemptions, actor, status, dates and effects against source text. A document disposition alone is insufficient.
3. Generate below/on/above fixtures for each extracted threshold, and test effective starts, sunsets, leap years, reverse comparisons and conflicting versions with independent expected outputs.
4. Add corrupted/duplicate/missing-input publication tests, hostile extraction documents, paraphrase/format/order invariance and omission/operator/date mutations. Test whether the gates actually reject the altered artifacts.
5. Expand independent stratified reference cases, including every rule/category, ambiguous geography, unknown owners/CO and negative findings; keep reviewer disagreement visible. Run organizer dev/held-out scoring and actual T6 only when supplied.
6. Prove a fresh frozen snapshot can be reconstructed/replayed with the same source/code/evidence identity. Existing saved-result reproduction is a useful step, not that complete proof.

These are missing assurances, not evidence that every currently unchecked row is wrong. Do not silently fix them by hand-writing rules or treating unknown as false.

## Findings, ordered by priority

The initial 24 findings are retained below. F25-F28 were added after reviewing the fifth supplied document, `Rental Housing Law Navigator  Edge-Case-Hardened Implementation Strategy.md`. Its full review, primary-source fact-checks, unknown-resolution matrix and proposed implementation acceptance checks are in [RELIABILITY_PLAN.md](RELIABILITY_PLAN.md). F29 was confirmed during the subsequent pasted-solution review, bringing the total to 29 findings. [SOLUTION_REVIEW.md](SOLUTION_REVIEW.md) records the proposal verdicts, new diagnostic replay and research limits. These documents do not claim implementation fixes.

### F01 — High: snapshot identity does not cover snapshot content

`scripts/publish.ts:190-206` hashes only rules, base properties, the constant `engine-v1`, and as-of date. The written bundle additionally contains evidence, change tests/results, document ledger, address audit, source texts, and a fresh timestamp. Changing property evidence or tests can leave the ID unchanged while overwriting `snapshot.json` and source files. Repeating an identical publication also overwrites the timestamp and can set the pointer's previous ID to itself.

`src/lib/data.ts:29-46` caches snapshots indefinitely by ID, relying on immutability. A running website can therefore serve an old cached object under the same ID that now denotes different disk content. Saved proof references cease to identify a unique bundle.

**Fix:** hash the complete canonical decision inputs and source identities, include an actual engine version/hash, and refuse to overwrite an existing bundle unless content matches. Treat identical publication as a no-op. Stage the complete bundle before switching the pointer.

### F02 — High: legal evidence is insufficiently validated and first-record wins

`src/lib/engine/evidence.ts:29-64` does not validate the `rule_status` enum, city scalar values, validity boundaries, legal subject identity/level, or legal match confidence. A synthetic record with `rule_status: "not-a-status"`, weak match, and validity starting in 2099 was accepted as validated.

`evidence.ts:127-142` applies legal records without a query date or conflict detection, selects the first matching status/date, and trusts persisted `status: "validated"`. The probe confirmed the invalid status entered rule logic. Two contradictory dates can be silently resolved by file order. Property evidence has a validity filter; legal evidence does not.

**Fix:** validate records at the ingestion boundary using a runtime schema, check subject/field/value combinations and actual dates, and reject conflicting legal records rather than choosing the first. Separate an enactment-history fact from a time-limited legal version so historical queries select the appropriate version.

### F03 — High: conflicting effective dates are ignored when the base result is definite

`src/lib/engine/resolve.ts:257-258` enumerates only base `unknown` evaluations. Date disputes are added later in `buildVariables`, so a chosen exact date that already yields `applies` never triggers dispute analysis when its category has no unknowns.

**Confirmed probe:** an enacted rule with chosen effective date 2025-01-01 and disputed date 2027-01-01 returns `applies`, method `data`, exhaustive `true`, on 2026-01-01. The existing dispute test starts inside a partial month and misses this case. `engine.ts` also initializes evaluation conflict flags independently of `Rule.conflict_flag`, so a source-date conflict can lack the report's conflict badge.

**Fix:** consider legal disputes before classifying results as definite, and propagate source-version conflicts distinctly from local preemption.

### F04 — High: publish gates do not enforce the advertised contracts

`scripts/publish.ts:169-175` checks nonempty rules, at least 500 properties, rule-ID uniqueness, and quote length. It does not revalidate the official schema, verify quotes against the current documents, check property-ID uniqueness, inspect extraction errors, or validate persisted evidence. Candidate and evidence JSON are read through unchecked casts.

Today's artifacts passed the additional audit checks. That does not mean a later `npm run publish` will reject a corrupted quote, malformed record, duplicate property, or partial extraction.

**Fix:** put schema, source hash/span, evidence, unique-address, and processing-completeness checks inside publication. Fail before writing anything.

### F05 — High: identity adapters can promote incomplete matches to facts

`scripts/evidence/adapters.ts:128-146` accepts the first high-score NJ point candidate. The subsequent check uses a house-number string prefix; a failed check still receives `normalized` confidence, which the validator accepts. Multiple listed addresses need not all succeed before one municipality record changes the property.

`adapters.ts:173-192` queries LADBS by number range and the first street-name token, drops direction, and promotes a unique returned date to a normalized building match without checking the full returned address or parcel. `adapters.ts:81-102` treats ZIP-to-ZCTA place membership as an exhaustive candidate set; `applyPropertyEvidence` can promote a single candidate to a known municipality despite the documented ZIP/ZCTA mismatch.

These are confirmed code paths, not demonstrations that a current property was misidentified. Current LADBS records are inconclusive.

**Fix:** require explicit address/parcel corroboration, reject mismatches, retain ambiguous alternatives, and keep ZCTA evidence advisory unless location identity is independently established.

### F06 — Medium: change tracking misses coverage loss and uses a different resolution path

`src/lib/engine/changes.ts:108-112` counts a changed rule only when its after-result belongs to `applies`, `unknown`, or `superseded`. It misses `applies` to `not_applicable` and reversed effective-date comparisons. A synthetic reverse comparison from after enactment to before enactment returned zero affected properties.

`src/app/app/changes/page.tsx:19` evaluates custom comparisons on raw snapshot properties. Published change cases use properties enriched once at publication date, while property reports apply evidence at the requested date and call the constraint resolver. The same address/date can consequently have different inputs or uncertainty treatment across views.

**Fix:** compare both directions, define impact separately from current coverage, and use one date-aware evidence/resolution entry point for reports and change comparisons. Add dedicated change tests.

### F07 — Medium: section history extraction is not anchored to the cited section

`scripts/evidence/adapters.ts:207-209` takes the first matching “added ... effective ...” sentence from an entire division PDF. It does not locate the section in `rule.citation` before assigning that history to the rule.

**Fix:** locate and bound the cited section, then verify the adoption history belongs to it. Add a multi-section fixture with different dates. Current dates were not independently legally reviewed by this audit.

### F08 — Medium: CO bounds are assumptions presented as known facts

`src/lib/engine/facts.ts:48-60` assumes first CO occurs between January 1 of the build year and December 31 of the following year, then marks that interval `known`. `resolve.ts:194-198` excludes completions outside the same bound, even if a retrieved CO record says otherwise. CO-bound evidence derived from an assessor year is likewise labeled known.

The fact note discloses the assumption, but the evaluation's structured `presumptions` does not record it because the fact state is known. A construction year alone does not establish this one-year limit.

**Fix:** represent this as a disclosed assumption and keep unsupported upper bounds from establishing definitive coverage or rejecting an actual CO record. Preserve the year-precision distinction.

### F09 — Medium: proof generation mishandles empty completion sets

**Status: repaired in the final cross-check for the demonstrated empty-domain and correlated-irrelevance paths.** See the regression proof above. The following describes the original implementation; encoded CO/domain assumptions remain separately open.

`src/lib/engine/resolve.ts:280-323` can reject every completion as inconsistent. It then retains exhaustive `true`, computes `distinct.every(...)` on an empty array, and can emit an “established in every case” coverage statement despite checking zero admissible cases.

**Fix:** explicitly handle zero completions as contradictory inputs or an invalid domain; emit no universal coverage proof. Also test correlated variables: the current “decisive” test only compares pairs differing in one coordinate, which can miss dependencies where valid completions require simultaneous changes.

### F10 — Medium: documented T6 ID cannot load its source context

README and handoff use `--doc-id T6A`. `src/lib/data.ts:51` only accepts document IDs matching `^[A-Z]+\d+$`, rejecting `T6A`. Extraction/publication can create `T6A.txt`, but the evidence drawer cannot load its pinned context.

**Fix:** use one safe document-ID contract across ingestion, publication, and source loading; add a T6-shaped fixture. Actual T6 extraction remains unverified.

### F11 — Medium: failed extraction reruns remove previously accepted candidates

`scripts/extract.ts:294-302` removes all previous candidates for every targeted document, including documents whose rerun failed. A transient CLI/API error can erase a successful prior result; the ledger records an error, but publication does not block on it. Progress is written only after the entire pool completes.

**Fix:** preserve successful prior generations until a replacement succeeds, retain failure records separately, and checkpoint successful document work. Do not mix partial new results with a verified prior generation silently.

### F12 — Medium: `.env.local` starter override is ineffective for CLI paths

**Status: repaired.** Shared config now loads the environment before deriving path constants, with a passing subprocess regression. The following describes the original failure.

`scripts/config.ts:6` resolves `STARTER_DIR` during module initialization. Only extraction calls `loadEnv()`, and that happens after imports have already frozen the path. Geocoding, publication, enrichment, and measurement do not call it at all. README explicitly instructs users to put `STARTER_DIR` in `.env.local`.

**Fix:** load the environment before deriving path constants, using Node's environment-file support or one shared initialization. Test with the starter outside its default directory.

### F13 — Medium: known extraction errors remain in the working rule set

The existing evaluation reports C08 as an overclaim and C34/C35 as conflicting outputs. The handoff documents the LA RSO year-only cutoff. Consolidation groups by `status_kind`, so pending and enacted versions of the same law remain separate, as with Berkeley. Selecting coverage by maximum atom count also does not prove that the selected conditions match the source version supplying the headline quote.

**Fix:** correct these through automated extraction, preserving source-specific dates and condition provenance. Do not hand-edit submission rules. Resolve duplicate legal versions before claiming one current answer. The recorded 0.969 definitive-answer accuracy uses 32 definite answers in a small author-correlated set; it is not a population accuracy estimate.

### F14 — Low: setup and continuity documents lag the implementation

**Status: repaired for the identified stale commands, setup prerequisites and handoff claims.** The missing changes command was removed and documentation was refreshed from observed artifacts. The following describes the original state; underlying correctness findings remain open.

`package.json:16` advertises `npm run changes` but `scripts/changes.ts` does not exist. README omits enrichment and measurement setup, and `enrich.ts:23` requires Python plus `pypdf`, unlike the Node-only website setup. Handoff counts, snapshot, geography limitations, and San Diego status predate subsequent evidence work.

**Fix:** remove the dead command or point it to the real workflow. Document optional pipeline prerequisites and update handoff from actual published artifacts, distinguishing them from working evaluation data.

### F15 — Low: malformed dates and clarification inputs can slip through

`src/lib/data.ts:56` combines a format regex with `Date.parse`, which normalizes some invalid calendar days. Evidence dates are checked only with a regex. `resolve.ts:383-390` accepts arbitrary answer intervals inside domain bounds rather than requiring an offered option; nonnumeric strings can produce NaN, whose comparisons do not trigger rejection.

**Fix:** validate real calendar dates and finite numeric values, and require clarification answers to match an offered cell. Add malformed-input fixtures.

### F16 — Low: accessibility and browser-proof coverage remain partial

`src/components/address-search.tsx` declares a combobox but has no ArrowUp/ArrowDown active-option management or Enter-selection behavior. Suggestions are reachable by Tab, but the declared combobox pattern is incomplete. No `loading.tsx` or route `error.tsx` exists; corrupt/missing artifacts can surface generic failures. The changes table's “full list” download is the official static changes export even for a custom comparison, so it need not contain the displayed custom results.

The browser suite tests an unauthenticated second session rather than a second authenticated user's HTTP access. Unit tests do verify two-user database isolation. Browser checks do not test saved-report downloads, invalid extraction, snapshot immutability, legal-evidence conflicts, or actual T6.

**Fix:** use a complete combobox pattern or simpler native interaction, provide recoverable artifact errors, and make custom comparison export match its displayed result. Extend browser tests only for the missing meaningful journeys.

### F17 - High: untestable exemptions are assumed false rather than left unknown

`scripts/publish.ts:43-52` marks exemptions composed entirely of `other` predicates as `presumed_inapplicable`, except those converted by a broad local-law regex into precedence. `src/lib/engine/engine.ts:143` then converts an unknown exemption to false. Eleven exemptions across seven current rules carry this flag. For example, shared kitchens, nonprofit cooperatives or transaction-specific exemptions cannot be dismissed merely because the sample has no field for them.

The unit test "untestable exemption is a disclosed presumption" explicitly expects applies. Thus this is an intentional tested policy, but it does not satisfy the broad missing-data-is-unknown invariant or C12/N7's conservative requirement. In-memory sensitivity testing changes 694 rule/address outcomes across 414 properties when only these flags are disabled: 497 applies and 197 superseded become unknown. The affected rules are `r-b3a720`, `r-f6181c`, `r-75fd18`, `r-bd8a8f`, `r-14dcf7`, `r-9e0d5c`, and `r-63566f`.

Separately, `facts.ts` assumes affordable restriction false for 474 properties; disclosure does not make that an observed fact. This sensitivity test did not remove that assumption or CO bounds, and does not prove 694 incorrect real-world answers.

**Fix:** preserve unknown for unsupported exemptions, or make an explicitly selected hypothetical assumption separate from the evidence-only result. Obtain authoritative facts where possible and expose the decisive question otherwise. Use source-backed scoped precedence relations instead of an all-purpose local-law regex. Change the test expectation to enforce the selected evidence-only contract.

### F18 - High: document processing is not verified provision/exception completeness

`scripts/extract.ts:112-119` partitions by paragraph at 40,000 characters, with no section hierarchy, scoped definition index, cross-reference closure or check that inherited headings/exceptions accompany each chunk. Available texts D049 (55,982 characters) and D067 (161,137) cross this threshold. A paragraph split is not necessarily wrong, but it can separate a rule from the qualifier defining its scope. A document-level processed ledger cannot identify that omission.

The research documents and MVP C2/C6/I10 ask for provision packages or a lightweight section disposition inventory. Neither is implemented. All available text going through an LLM once establishes processing coverage, not clause recall. Thirty-three reference-only dispositions also remain outside extracted-text coverage.

**Fix:** add a small section/scope inventory, retain parent headings, carry referenced definitions/exception context into extraction, and quarantine unresolved dependencies. Track reviewed/unsupported/no-rule dispositions at relevant section level. Audit the actual source clauses rather than inventing a four-rule omission from the PDF's count. No vector database is necessary for this small corpus.

### F19 - High: arbitrary historical queries lack legal end dates and version selection

`types.ts:Rule` stores a start date and a static enacted/pending/failed kind, but no legal `effective_to`, repeal/sunset interval, amendment patch lineage or dated effect schedule. `engine.ts:101` treats an enacted rule with null effective date as in force on every query date. Thirty-three current consolidated rules have a null start date. This may support "current law per source", but cannot justify applying them to an arbitrarily early historical date.

Amounts and phased requirements live in a single requirement string; the implementation does not select dated schedules. For example, the LA requirement text contains a February 2, 2026 utilities provision while its rule date is null, and SF annual amounts are stored as one current value. These are concrete representation limitations, not independent legal determinations of what the historical amounts should be. Legal evidence is likewise not selected by query date (F02).

**Fix:** distinguish "known current, history unresolved" from a proved historical version. Use simple valid-from/valid-to intervals and dated effect variants for supported sources, retaining amendment/source lineage. Reject or mark unknown unsupported historical queries; verify starts, sunsets, phases and reverse changes. Full legislative event infrastructure is unnecessary for the MVP.

### F20 - High: condition/exemption evidence lacks exact field-specific provenance

All 77 candidate headline quotes and 54 active headline quotes pass exact original-span checks. The weaker internal support is a different contract: of 124 candidate condition/exemption-leaf quotes, 35 are not direct source substrings; of 77 exemption-level quotes, 25 are not direct substrings. All these nonexact strings are recoverable through the existing canonical matcher, consistent with formatting normalization rather than demonstrated hallucination. Short direct quotes below `findQuote`'s minimum length were not counted as failures merely because that matcher rejects short input.

`extract.ts:208-218` makes unmatched long atom quotes review notes rather than fatal errors, does not validate exemption-level quotes the same way, and does not replace internal quote strings with the original span as it does for `quoted_span`. Consolidation chooses headline source and maximum-atom logic independently (`publish.ts:67-100`). Among 96 merged condition/exemption-leaf atoms, 41 do not appear exactly in the chosen headline document; they can be recovered canonically in available source documents, but lack their own document ID/offsets. `data.ts:evidenceFor` displays these beside the headline source context. A review string mentioning a second document is not a structured field evidence map.

There is also no semantic verifier proving that a source span entails each extracted status, date, actor, operator, precedence relation and effect, or that a nearby counterexception was retained.

**Fix:** run the existing matcher on every internal support span, store original text plus its own document/hash/offset, and preserve that reference through merging and UI display. Validate required field support and clause sufficiency separately from headline quote existence. Keep multiple individually exact spans; do not stitch them into a fabricated quote.

### F21 - Medium: coverage proof does not prove complete obligations or alternative effects

`types.ts:Rule` has a requirement string and untyped `key_value`; it has no structured actor, deontic modality, penalty/remedy, amount/unit/formula or separately guarded alternative effect. The engine establishes coverage and precedence, not a transaction-specific legal amount. Larger-deposit small-landlord alternatives and annual schedules can be described in text without being fully evaluated for that property/date.

CNF can represent many nested Boolean conditions; the gap is not that any nested logic is impossible. The missing assurances are preserved source scope, counterexception/alternative-effect semantics and a proof that the extracted expression is equivalent to the provision. The publication warning for text-only exemptions with empty atom arrays does not supply that proof.

**Fix:** separate rule coverage from effect completeness in report/export metadata. For effects actually calculated, use the smallest typed representation needed for unit, formula, timing and guard; retain unsupported transaction facts as unknown. Add actor/penalty extraction if required by the event brief without silently extending the official schema. Avoid presenting a coverage result as a complete compliance instruction.

### F22 - High: tests establish execution and consistency, not independent legal completeness

The 31 passing unit tests cover engine, resolver, evidence, facts/quotes and database behavior using selected fixtures. There is no dedicated extraction/consolidation/publication/change-module test suite and no exhaustive per-rule boundary, legal omission, adversarial document, mutation or extraction-invariance suite. No independent reviewer or organizer label set adjudicates all 500 addresses. The 37 reference cases cover only 19 properties, and their author is correlated with implementation.

The masking experiment restores the system's own assumed facts and compares with the same engine. It can pass even when both runs use the same wrong CO bound or omit the same exemption. A population run does not detect a law absent from the rule set. Confirmed failures F03/F06/F09 and known C08/C34/C35 demonstrate practical gaps despite passing tests.

**Fix:** add targeted defect regressions and fail-closed pipeline corruption tests first. Then independently review a stratified set covering each provision, threshold, ambiguity, negative finding and version conflict. Use mutations to show wrong operators, omitted exemptions, changed source text and impossible evidence are caught. Report execution coverage, reference agreement and independently adjudicated accuracy separately.

### F23 - Medium: saved proof JSON is not a self-contained offline replay receipt

`src/lib/actions.ts:saveReportAction` stores property, all evaluations, blocking questions, property evidence and only rules whose result is not `not_applicable`. It does not bundle all source texts/field spans, content hashes or the executable engine identity. A downloaded report therefore lacks the complete inputs needed to recompute every included evaluation independently of the repo. `engine_version` is the constant `engine-v1`, and F01 weakens snapshot pinning.

The UI explicitly saves official facts rather than hypothetical answers; that is a documented behavior, not an accidental loss of user input. The gap is the stronger replayable evidence-receipt claim in MVP I9/N7. No offline receipt replay or corruption-rejection test was demonstrated.

**Fix:** define the receipt's promise precisely. For offline replay, include the required rule/fact/source identities and a real code version, with a small verifier and corruption fixture. If it is only a pinned result download, label it accordingly and enforce snapshot immutability first.

### F24 - Medium: fresh extraction/geography runs are not fully pinned

`scripts/extract.ts:243` defaults CLI extraction to the mutable alias `sonnet`. `callModel` keys cache content on provider/model string, prompt version/system/meta/text/feedback, but not a hash of the output schema, parser/compiler or full provider settings. A cache hit is read through an unchecked cast. Schema or interpretation changes can reuse stale output without an appropriate version bump. `scripts/geocode.ts:25` uses `Public_AR_Current` / `Current_Current` rather than a pinned numeric benchmark/vintage.

The saved freeze reproduced offline during this audit. That does not establish a fresh uncached run at a later date will reproduce the same candidates or geography. The corpus has source hashes and model/prompt metadata, but no complete immutable run manifest tying code commit, compiler/schema, concrete model, parameters and geography vintage to every publication.

**Fix:** record and version the actual model/settings, schema/compiler hashes and geography benchmark/vintage where supported; validate cached output at its consumption boundary. Tie them to snapshot content identity and retain raw responses. Use a small run manifest, not a new orchestration service.

### F25 - High: conflicting property evidence can retain an unsupported definite result

**Status: repaired for the demonstrated scalar and municipality overlay conflicts.** Known-original unit/year/CO conflicts now invalidate the affected fact; derived CO bounds are cleared when their year is disputed, and independent CO records remain intact. Geography alternatives and conflict reasons are preserved. The following records the original failure; evidence validation and source authority are still separate open findings.

`src/lib/engine/evidence.ts:93-94` logs differing validated values for a field and continues, preserving the original CSV/derived fact. It does not expose the competing alternatives to the evaluator or mark the retained fact disputed. The comment "field left open" is therefore not accurate when the original fact is known.

**Confirmed synthetic probe:** original building units = 20; two validated same-building claims = 2 and 20; rule requires more than 2. Overlay logs the conflict, retains known 20, and the engine returns applies. A warning alongside a definite result is not sufficient when the conflict can change that result. The probe establishes the failure path, not a currently wrong sample record.

**Fix:** preserve claims and provenance, distinguish superseded evidence from unresolved credible conflict, and evaluate admissible alternatives or mark the fact unknown. Retain certainty only when the result is proved identical across those alternatives. Keep Strong Kleene truth with explicit conflict metadata rather than silently changing the repository's logical model.

### F26 - Medium: fact parsing accepts future/sentinel years and lacks a declared numeric contract

`src/lib/engine/facts.ts:57-60` accepts any integer build year greater than 1700, with no upper/context bound. The probe `year_built: "9999"` becomes known and also constructs a CO proxy. `units: "2e1"` becomes known 20 through JavaScript `Number`, illustrating that accepted numeric syntax is broader than ordinary digit-only assessor fields.

No such sentinel was observed in the current 500 rows, so this is an input hardening defect, not an observed current-row error. A numeric syntax policy should explicitly decide whether scientific notation is valid rather than inheriting JavaScript coercion. A maximum year should use source capture/context, not an earlier historical query date that would incorrectly invalidate an otherwise valid recorded fact.

**Fix:** validate numeric syntax, finite integer values, source-appropriate ranges and interval ordering while preserving raw strings. Add sentinel/future/whitespace/malformed and invalid derivation fixtures. Reject invalid CO/date constructions before they enter resolution.

### F27 - Medium: 88 missing NJ unit counts become exact shorthand-derived values without verified mapping

`src/lib/engine/facts.ts:39` treats every isolated `nU` token in an NJ building description as exactly n units, ahead of the `4C` classification fallback. In the supplied sample, 88 empty unit fields are filled this way. Example `A0002`, `6B-20U-G`, becomes known exactly 20. The supplied participant guide explicitly calls the original NJ unit counts missing.

The official [MOD-IV handbook](https://www.nj.gov/treasury/taxation/pdf/lpt/modIVmanual.pdf), PDF pages 29 and 32, documents a structured apartment-count field and a 5-or-more apartment classification. The checked building-description section permits supplemental codes; it does not establish that every local `nU` string is a verified exact count for this dataset. This is an unverified derivation, not proof that all 88 inferred counts are wrong.

**Fix:** corroborate the specific shorthand against source-specific documentation or structured parcel/building counts. Otherwise use only a supported classification interval when sufficient for the rule, retaining its derivation/provenance. Do not manufacture exact counts or discard genuinely documented bounds.

### F28 - Medium: organizer proposal aliases are not individually distinguished

`src/lib/engine/changes.ts:51-63` matches organizer IDs by jurisdiction/category and only checks whether their suffix starts with P. Both `MA-ALG-P1` and `MA-ALG-P2` currently resolve to both H.5222 and S.2983. The supplied combined T4 set can still total 110 correctly, hiding the ambiguity. A later single-proposal amendment/scenario could unintentionally activate both.

The official schema permits team-owned IDs; changing all `team_rule_id` values to organizer names is not necessary. The gap is validated matching of individual test aliases to the intended extracted provision(s).

**Fix:** use explicit source/citation-backed alias matching, preserving organizer test inputs and reporting unmatched/ambiguous IDs. Verify each MA proposal separately and the combined T4 scenario. Do not derive a law's content from the organizer label or hand-write rule records.

### F29 - High: conditional outcome explanations discard joint fact relationships

**Status: repaired.** Joint branch conditions now identify the actual completion set, with independent XOR/OR/AND truth-table regression checks and matching website rendering. The following describes the original failure and motivating acceptance checks.

`src/lib/engine/resolve.ts:307-313` projects each result's completion set onto individual variable values. `merge` drops a variable when all its cells occur in that projection. This loses correlations that determine the outcome. The reported conditions are not generally a complete description of the corresponding completion set.

**Confirmed synthetic probe:** the permitted CNF expression `(X OR Y) AND (NOT X OR NOT Y)` returns applies for `(false,true)` and `(true,false)`, and not applicable for `(false,false)` and `(true,true)`. The resolver correctly retains overall unknown and counts four exhaustive completions, but emits `when: []` for both outcome branches. Correct branch conditions are `X != Y` and `X == Y`. The current UI at `src/components/rule-card.tsx:70` displays "in some cases" for these empty conditions, so this fixture proves an explanation loss, not an unconditional applies claim. It does not establish that a supplied property currently has this exact XOR clause.

**Fix:** preserve joint tuples or an equivalent verified Boolean expression/decision tree. Check that every admissible completion selects exactly its independently expected outcome. Mark necessary-only constraints explicitly; do not present per-variable marginals as complete decision conditions. Keep applicability and branch construction in the shared engine. This differs from F09's incorrect irrelevance reasoning under correlated facts.

Reproducer and four-assignment results: ignored `.cache/audit/pasted-review-check.ts` and `.cache/audit/pasted-review-results.json`; the full fixture is preserved in [SOLUTION_REVIEW.md](SOLUTION_REVIEW.md#new-confirmed-defect-conditional-branches-lose-correlations-f29).

## Pasted-solution validation and additional diagnostic ledger

Read the full 571-line pasted proposal and checked its main recommendations against the shared implementation and starter guide. Most principles are valid, but the examples are not executable specifications. `A0107` is a Los Angeles/CA property and `r-b0e375` is an NJ rule; that example pair actually returns not applicable. The proposed category enum and associated SF-style threshold also do not match the pair. A labeled benchmark CO interval still introduces an unsupported one-year lag, and "before/after" cutoff branches omit the exact day. The starter's SF/LA examples explicitly include the cutoff day.

A fresh offline replay reproduces **680 unknown results across 339 properties**, **27,000 evaluated pairs**, and **zero enumeration-limit properties**, using current working evidence at `2026-10-01`. It creates a **680-row diagnostic ledger** in ignored `.cache/audit/unknown-ledger-review.json`, with code/input identities, encountered missing fields, reported decisive questions, conflicts and branches. It preserves current audited assumptions to reproduce the baseline; it does not certify those outputs. A selected nine-file working code hash supplements commit `4f2e38a`; this is not a complete immutable release manifest.

Encountered memberships are CO 394, other 552, owner type 327, owner occupancy 315 and year 18. The current resolver reports decisive memberships CO 394, other 372, owner type 160, owner occupancy 8 and year 30. The latter can include indirect shared-fact dependencies and is not necessarily a subset of the former. Both overlap; neither is a count of distinct properties. Existing resolver defects mean the reported dependencies are diagnostic, not independent proofs. Retrieving or typing a field cannot be assumed to eliminate every encountered membership.

The 2.52% unknown-pair rate includes many wrong-jurisdiction pairs and is not a 97.48% legal-accuracy score. No identified run establishes the origin of 640. Consensus search/fetch and accessible primary paper abstracts support formal representation and guard/boundary/mutation testing as methods, not RuleTwin accuracy. Scite rejected account access because a paid plan/trial is required; no Scite citation-context verification was obtained. [SOLUTION_REVIEW.md](SOLUTION_REVIEW.md) gives the detailed verdict matrix, sources and implementation acceptance cases. Product code, supplied data/tests, official exports and the active pointer were unchanged.

**Repeat validation:** the supplied attachment hash and the checker's selected input/code hashes remain unchanged; the full working replay reproduces the same counts and F29. A fresh `npm test` run passes 31/31 with zero failures/skips. This does not close the findings: `engine.test.ts:50` expects certainty from the unsupported CO upper bound; `engine.test.ts:147` expects applies from a presumed-false unknown exemption; and `evidence.test.ts:46` tests conflicts only when the original fact is missing, leaving the known-original conflict case uncovered. Fix the expected evidence-only behavior and add independent regressions when repairing these defects. The [repeat-validation table](SOLUTION_REVIEW.md#repeat-validation-of-the-same-supplied-proposal) records the precise gaps. Browser/build checks were not rerun for this documentation update.

## Fifth-document research review and additional uncertainty replay

The new strategy correctly prioritizes deterministic evaluation, explicit uncertainty, boundary/mutation tests and immutable artifacts. Its examples need correction: several enum names omit underscores required by the real schema; its pending-before-jurisdiction pseudocode could leak proposals into other states; fixed city counts cannot establish address identity; and two spatial checks using the same Census coordinate are not independent proofs of location. A solver checks the encoded model, not omitted natural-language clauses or unknown property facts. Its 24-hour schedule is not a measured estimate for this repo.

Primary documentation and selected cited paper abstracts were checked online. Census confirms approximate interpolated coordinates, PostGIS confirms boundary-aware covers versus contains, and Z3 documents solver unknown results. Selected LegalBench-RAG, LGMT, formal legal reasoning, temporal QA and risk-control papers match the cited topics; their experiments were not replicated. The LawShift/OpenReview link was blocked by browser verification. See the linked plan for exact sources and the limits of each fact-check.

An additional offline **constraint-resolution** run disabled only `presumed_inapplicable` exemption flags, keeping all other current working facts/evidence/assumptions. It produces **1,374 unknown results across 499 properties**, **1,412 questions**, and **zero enumeration-limit properties**, compared with the original working 680 unknowns across 339 properties. This agrees with the earlier raw 694-result sensitivity difference. It is a policy sensitivity run, not a certified corrected legal result set. It shows that conservative repair may increase uncertainty, and that SMT replacement is not required to enumerate this particular modified dataset.

The normalized missing unit counts are all MA: 32 properties; CA/NJ have zero after current derivations. Year built is missing for 212 properties. Owner type, owner occupancy and owner portfolio remain missing for all 500. These facts cannot be "solved" by assigning defaults. Use source-backed evidence, valid simplification, or clearly hypothetical clarification; otherwise keep the material decision unknown.

## Ponytail complexity pass

The runtime dependency list is restrained. SQLite, Node tests, native dialog, and direct TypeScript execution already avoid substantial infrastructure. The constraint resolver addresses a current requirement; replacing it with a generic SMT framework would add unnecessary complexity.

- `delete:` remove unused `rsoImplications`; no callers exist, and the supported property-level RSO record intentionally does not decide unit coverage. Replacement: nothing. [`src/lib/engine/evidence.ts:146`](../src/lib/engine/evidence.ts#L146)
- `delete:` remove unused `evaluate` wrapper that bypasses the evidence/resolution entry point. Replacement: existing `resolveFor` for report callers. [`src/lib/data.ts:59`](../src/lib/data.ts#L59)
- `delete:` remove the unused `dateInterval` import/re-export in the resolver. Replacement: engine export when needed. [`src/lib/engine/resolve.ts:15`](../src/lib/engine/resolve.ts#L15)
- `shrink:` remove `Object.fromEntries(Object.entries(byAdapterOf(stats)).map(([k, v]) => [k, v]))`. Replacement: `byAdapterOf(stats)`. [`scripts/enrich.ts:121`](../scripts/enrich.ts#L121)
- `shrink:` reuse the latency summary for console reporting instead of maintaining a second adapter aggregator. Replacement: iterate the existing summary. [`scripts/enrich.ts:126`](../scripts/enrich.ts#L126)

Estimated net: approximately 25 fewer lines and 0 fewer dependencies possible. Estimates are advisory; no deletion was applied. Keep trace contracts, provenance records, and focused tests even when they add lines.

## Recommended order of work

1. Restore conservative unknown handling, remove unsupported CO certainty, handle property conflicts and validate facts; add focused regressions for overclaims, contradictory proofs and joint conditional branches (F08, F09, F13, F17, F25-F27, F29).
2. Repair snapshot identity/immutability and make publication enforce schema, evidence, provenance and completeness contracts (F01, F04, F20).
3. Fix legal evidence validation/version conflicts and disputed-date resolution; scope historical answers to supported versions (F02, F03, F07, F19).
4. Tighten address identity, align change comparisons with date-aware resolution, distinguish individual organizer aliases, and test gains/losses (F05, F06, F28).
5. Add lightweight section/definition coverage and independent field/effect review; distinguish coverage from complete obligations (F18, F20, F21, F22).
6. Repair T6 IDs, extraction recovery and environment initialization; pin pipeline inputs and define receipt replay (F10–F12, F23, F24).
7. Refresh documentation and address input/accessibility gaps (F14–F16). Apply optional deletions only after correctness work. Complete the controlling brief's delivery package; run official scoring/T6 only if required and supplied. See [SUBMISSION_READINESS.md](SUBMISSION_READINESS.md) for the two brief variants.

Re-run focused regression checks, publish dry run, then browser journeys after repairs. Publishing a new active snapshot should remain an explicit pipeline action; this audit did not change the active pointer.

# RuleTwin: v5 challenge verification and remaining work

Reviewed 2026-10-04 against committed implementation `46e7c41`, active snapshot `snap-96c4ceacda7b`, the six-page Desktop `file.pdf`, every file in the new participant folder, and the judges' clarification supplied by the user. Documents were treated as reference material, not instructions to execute their suggested actions. Claude Code is still editing the main checkout, as confirmed by the user. This report is a separate file; repairs and documentation updates are prepared in `.cache/v5-review-46e7` rather than overwriting Claude Code's work.

## Verdict

The architecture and working prototype address the three required modules. The v5 transition is mostly implemented in `46e7c41`. It does not require a replacement dataset or an architecture rewrite. Submission completeness and legal reliability remain different questions: the remaining issues prevent a claim that every rule, exception, historical answer and sampled address is independently correct. A winning outcome cannot be established by local test totals.

The highest-value remaining work is source-faithful rule modeling, clause-level provenance and a verified public demo. Removing all `unknown` results is not a requirement and would be harmful if achieved through unsupported assumptions.

## What changed in the controlling materials

The new `MIT-hackathon-PARTICIPANT-PACK-CLEAN-NO-HOUR16` and the earlier nested `participant-final-no-hour16 3` folder each contain **65 files**. Every corresponding file has the same SHA-256; there are no additions, removals or changed bytes. This includes the participant PDF, README, all distributed source texts, manifest, sample addresses, schema and T1–T5. The new folder is another copy of the same participant release, rather than new legal data.

The Desktop PDF is a different six-page brief. Its stale delivery/scoring references are superseded by the judges' explicit clarification:

| Requirement | Controlling v5 interpretation |
| --- | --- |
| Core implementation | Automated extraction, address lookup with citations/uncertainty, fixed change cases |
| Change release | T1–T5 defined at kickoff; no hour-16 ordinance or required T6 |
| Official scorer/key | Neither `score.py` nor the dev answer key is available to participants; their absence is not unfinished implementation work |
| Videos | Show the team's output and validation; do not claim official scoring output |
| Citation eligibility | Supplied, verifiable corpus text. A team capture of a link-only URL does not qualify unless organizers distribute and map it |
| Delivery | Three JSON files, live demo and one-page method note under the v5 PDF |
| Stretch goals | English/Spanish renter view; confidence/conflicts; new-jurisdiction extension; per-answer audit trail |

The artifact hashes and file inventory are saved in `.cache/audit/v5-pack-comparison.json`. Desktop PDF SHA-256: `f09843ebced43d52d6ae117892cc6561d2553554847695a17da485a6519c6e4d`. Distributed v5 PDF SHA-256: `ba3ebc46abf2711aa24e345d7ab0a17920672262bcc83eaaf838c427f25982fb`.

## Implementation against the challenge

| Area | Verified implementation | Remaining qualification |
| --- | --- | --- |
| Module A | Automated candidates, consolidation, document ledger, exact headline quotes, penalties and EN/ES requirements | Processing a document does not prove every provision/exception was extracted. Field-level support and exemption-effect modeling remain incomplete |
| Module B | 500 addresses, legal-city resolution, shared deterministic engine, dated evidence, precedence and conditional clarification | Owner/CO/subsidy facts can remain missing or presumed. A0346 is unresolved. No independent gold review covers all 500 properties |
| Module C | T1–T5 exports; pending bills use a hypothetical; failed ballot question never applies; reverse-change and proposal-alias regressions | Exact replay is established, but no organizer gold sets exist locally; T2 needs independent address-level boundary adjudication |
| Renter usability | English/Spanish summary, confidence, source drawer, questions and audit download | Confidence is an engineering signal, not calibrated legal correctness. Accessibility coverage is partial |
| Extension | `scripts/ingest.ts` uses the normal automated pipeline; extension cases are separated from official outputs | A fresh extraction demonstration was not run in this audit; extraction cache/model/schema pinning remains incomplete |
| Delivery | Three generated JSONs, method note, demo script, hosted-mode implementation | Public repository HEAD is reachable, but a working public deployment and final demonstration were not established |

The public repository was read-only verified with `git ls-remote https://github.com/chappiethebot/Ruletwin.git HEAD`, returning `63098a535c43603a5139d0883e88354ed85eedb8`. This proves repository access, not that the audited local release or prepared repairs have been deployed.

## Fresh dataset checks and outcomes

Baseline inputs were hash-checked before and after the verification run. Candidates and evidence were unchanged. The prepared repair publishes **only in the isolated checkout**, producing `snap-3e8d479e4ac6`; the main checkout's active snapshot was not switched by this audit.

| Check at 2026-10-01 | Outcome |
| --- | --- |
| Rules / candidates / ledger / evidence | 48 / 73 / 89 / 310 |
| Raw CSV versus snapshot raw rows | All 500 records agree with independent Python CSV parsing; 500 unique address IDs |
| Official rule schema | All 48 records pass independent Draft 2020-12 validation; no schema errors |
| Lookup contracts | Exactly the 500 sample IDs; valid result enums and rule references; no duplicate rule/address entries |
| Shared evaluator population | 24,000 rule/address pairs: 19,247 not applicable; 3,373 applies; 289 superseded; 140 future; 440 pending; 511 unknown |
| Published results versus replay | Zero result-label mismatches |
| Open facts | 511 unknown evaluations on 207 properties; 369 clarification questions; zero enumeration-limit properties |
| Processed source hashes | Zero mismatches against the extraction ledger |
| Evidence validation replay | All 310 records retain their recorded validation status |
| Supplied headline support | 45 of 48 rules have an exact quote at the recorded offsets in actual distributed text with the mapped URL |
| Research support | Three rules use S037/S059, with no supplied-text eligibility; two local bans account for 90 `applies` answers |
| Key values / penalties | 45 nonempty key values; 17 non-null penalty fields, all nonempty. The handoff's “18 source-stated penalties” does not match the current consolidated exports |
| Internal support | 36 candidate condition/exemption-leaf quotes are absent or not direct substrings of their candidate document. This count does not include every exemption-level or merged-rule provenance issue |

The 3,283 supplied-headline-supported `applies` answers out of 3,373 positive answers are a **structural provenance observation**, not the organizer citation metric, semantic correctness or independent accuracy. Headline support alone does not prove all fields in a merged rule.

Independent quote replay uses **UTF-16 code-unit offsets**, matching Node's string indexing; Python code-point offsets incorrectly flag two otherwise exact spans containing non-BMP characters. The independent checker was corrected and all eligible spans/hashes now agree.

| Change case | Affected / conflict flags | What was checked |
| --- | --- | --- |
| T1 | 250 / 0 | Export/replay set equality and all CA sample IDs |
| T2 | 90 / 0 | Export/replay set equality; the implementation targets Hoboken/Jersey City. No independent city-boundary gold set was established |
| T3 | 140 / 90 | Export/replay set equality and all NJ sample IDs; conflict totals reproduced |
| T4 | 110 / 0 | Export/replay set equality and all MA sample IDs; unit regressions select S.2983 and H.5222 individually |
| T5 | 0 / 0 | Empty failed-measure impact reproduced |

These checks exercise every modeled rule/address pair, not every possible legal fact combination or omitted law. “All bits and bytes” is justified for the pack byte comparison, not for universal legal accuracy.

## Reference and edge-case testing

A fresh `node scripts/measure.ts` replay of the existing 37 AI-authored cases returns **31 correct definite answers, one wrong answer, one overclaim, three correctly indeterminate cases and one unmatched rule**. The 31/33 definite-answer agreement is not independent: the same authoring system selected/adjudicated the cases.

- **C35:** Berkeley at 2026-02-15 returns `applies` while the case expects indeterminate because the participant guide describes competing dates. The supplied D001 text does not establish the asserted March date. A fresh read of the [city's distributed ordinance PDF](https://berkeleyca.gov/sites/default/files/documents/2025-12-02%20Item%2001%20Ordinance%207992.pdf) likewise finds no March/2026 date. The date dispute remains unresolved; do not invent a corpus quote or silently select a preferred date.
- **C37:** the NJ new-construction exemption record returns `applies` for a building built in 1900, while the reference expects `not_applicable`. This exposes a distinction between the exemption's applicability and the parent municipal rent-control rule. The [NJ DCA statutory compilation, section 2A:42-84.2](https://www.nj.gov/dca/codes/codreg/pdf_regs/2A_42_74_et_seq.pdf) describes mortgage amortization/30-year limits and a separate no-initial-mortgage case. Use this to review scope, effect and required facts; do not hand-patch one address or assume every exemption is a simple fixed 30-year predicate. This newly consulted text is research, not organizer-added citation text.
- **C32:** the selector no longer finds a separate LA Resident Protections rule after consolidation. Review whether the selector is stale or a distinct provision/effect was lost. Do not change the expected result simply to improve the score.

The masking experiment covers 151 CA properties: 149 asked/resolved cases, two unresolved intervals and agreement over 7,238 definite modeled results. It verifies clarification consistency with the same engine and assumed facts, not their legal truth.

Existing tests cover Kleene truth tables; thresholds and day boundaries; rolling dates; missing facts; owner exemptions/counterexceptions; precedence; unresolved geography; pending/failed measures; malformed dates/answers; conflicting evidence; correlated domains; zero completions; enumeration limits; change losses; and individual pending-bill aliases. They do not exhaust every extracted expression, source omission or legal scenario.

## Repairs prepared separately

The review patch adds no dependencies and preserves all 48 rules and all current applicability totals:

1. Replace ID-prefix eligibility with verification against the **distributed manifest and supplied source text**, including exact quote offsets, source identity, URL and text SHA-256. Pin the result in new snapshots; an older snapshot without the check is labelled unverified.
2. Preserve S037/S059 as actual research source IDs. Do not remap their quotes to D037/D059, whose distributed rows are link-only.
3. Use pinned eligibility/reasons in the UI and per-address audit download. Reject forged eligibility metadata at publication.
4. Always read official change cases from the distributed file. Custom/extension cases cannot replace official cases or reuse their IDs; only supplied cases reach `changes.json`.
5. Update the audit, readiness, README, handoff, decisions, method note and demo script so obsolete 53-rule/691-unknown, scorer/T6 and penalty claims do not read as current evidence.

Verification in the isolated checkout: **55/55 tests, zero skips; typecheck; lint; production Webpack build; publish gates and full population replay; independent schema/CSV/provenance checks; 16/16 browser journeys at 1440px and 390px; HTTP checks of supplied-source metadata and research-source warnings.** The temporary server on port 3198 was stopped. An initial typecheck needed Next's generated route types; the production build generated them. Default Turbopack build was blocked by this isolated checkout's node_modules junction pointing outside its inferred root; `npx next build --webpack` succeeded. This is an isolation-environment limitation, not a demonstrated defect in the main checkout. Default-bundler verification should be repeated after integration.

No new extraction/geocoding, organizer-file edits, network scraping, public publication or deployment was performed. Research used public primary sources read-only.

## What is still left, in priority order

1. **Integrate the prepared patch after Claude Code finishes.** Inspect current changes, run `git apply --check` on the patch, reconcile any drift, and republish with the current inputs. Re-run the default production build and relevant gates. Do not apply over concurrent edits.
2. **Repair or quarantine C35/C37 with source-backed modeling.** Track competing date claims with their actual authority; distinguish exemption effects from parent-rule coverage. Preserve honest indeterminate results where evidence cannot choose an answer.
3. **Close field-level provenance and provision recall.** Store each condition/exemption/date/effect's own exact document span through merging; add a small section/exception inventory. Document processing and an exact headline are insufficient assurances.
4. **Measure unsupported assumptions.** CO within the build year, affordability defaults and untestable exemption defaults are presumptions, not observed facts. The guide's cutoff-year warning does not prove the chosen CO bound. `STRICT_EXEMPTIONS=1` addresses only exemptions and is not a complete evidence-only mode. Resolve material facts through admissible official evidence or scoped user clarification, with hypotheticals kept separate.
5. **Declare corpus coverage gaps.** Santa Ana algorithmic ban, Hoboken rent control and Newark rent control still lack distributed usable text. Do not fabricate records or promote research captures into citation credit. A manifest ID alone does not supply the missing law.
6. **Bound historical answers and replay claims.** Missing end dates/amendment histories and dated amount schedules do not support arbitrary historical certainty. Current audit JSON is useful but not a complete offline replay bundle. Pin fresh extraction/compiler/schema/geography versions if reproducibility is claimed.
7. **Finish delivery and independent review.** Verify the deployed URL in a fresh unauthenticated browser against the frozen release; demonstrate A/B/C, one unresolved case, citations and T1–T5 using own validation; finalize the one-page note and any requested video. Independently adjudicate a stratified clause/boundary sample and the T2 address set. Accessibility/keyboard recovery remains partial.

Source omission, unsupported certainty and release delivery matter more than adding unrelated features. There is no remaining requirement to obtain `score.py`, manufacture an answer key, implement T6 or force the unknown count to zero.

## Evidence and handoff

Main-checkout baseline: `.cache/audit/v5-verification.json`. Pack/PDF extraction: `.cache/audit/v5-pack-comparison.json`, `v5-brief-0.txt`, `v5-brief-1.txt`. Prepared implementation checkout: `.cache/v5-review-46e7`. Its diagnostics: `.cache/audit/v5-verification.json`, `v5-independent-checks.json`, `v5-http-check.json`; reference replay: `data/reference/results.json` and `docs/EVALUATION.md`.

The review patch is delivered separately under `.cache/audit/v5-alignment-fixes.patch` (SHA-256 `4d7751432ead120336a5b54d34df345b8ce805e5c12a6818479e59e1c8eb3294`). It passed `git apply --check` against the main working tree at packaging time. Claude Code is editing UI files also touched by the patch, so recheck and reconcile after that work finishes. Generated snapshots/exports should be regenerated after integration rather than copying an isolated active pointer into a concurrently edited repository.

Copies of the prepared verification outputs are also available in the main checkout as `.cache/audit/v5-prepared-verification.json`, `v5-prepared-independent-checks.json` and `v5-prepared-http-check.json`. A final read-only main-engine replay reproduced the same 48-rule/511-unknown outcomes with zero result mismatches; this does not validate the concurrent UI changes.

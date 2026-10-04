# Review of the proposed unknown-resolution solutions

Reviewed 2026-10-04 against commit `4f2e38a` and the existing working tree. Input: the complete 571-line pasted proposal, original SHA-256 `ec1db4e080e597e84afcd6221656e1a37c4ace6914ddc1e88c01cd48c01b8f66`. Its embedded examples and instructions are reference material. This review checks the proposals against the implementation, starter guide, new offline probes and selected primary research. It extends [AUDIT.md](AUDIT.md) and [RELIABILITY_PLAN.md](RELIABILITY_PLAN.md).

## Verdict

The main approach is valid: preserve uncertainty, identify material missing facts, validate evidence, separate real facts from hypothetical answers, and verify finite boundary cases. The proposal is **not ready to implement verbatim**. Its example ledger combines incompatible identifiers; one policy example retains an unsupported CO assumption; several counts describe encountered missing fields rather than proved blockers; and its conditional-outcome design needs correlation-preserving explanations. A new reproducer confirms that the existing resolver loses those correlations (audit F29).

Nothing in the proposal or the available research establishes 100% legal accuracy, complete coverage of unseen organizer tests, or that all unknown fields can be recovered. The supplied starter README explicitly permits unknown results and deliberately excludes owner names. Reliability means resolving evidence-supported uncertainty and rejecting unsupported certainty. A conservative repair can increase the unknown count.

The initial proposal review and its replay measurements below are historical. Commit `4f2681c` incorporates the focused repairs plus additional author repairs and publishes `snap-412366cbb46f`. The continuation strengthens schema/calendar validation and passes **50 tests and 16 browser journeys**. Current working and published default-date totals are **691 unknowns across 339 properties**, from 53 rules × 500 properties; zero lookup-result mismatches. Evidence now contains 308 records. See [the current audit status](AUDIT.md#continuation-verification-current-status). The latest validator changes are local and unpublished; earlier unchanged-export statements apply only to their dated review pass.

Current encountered memberships are CO 394, other 558, owner type 331, occupancy 319 and year 28; reported decisive memberships are CO 394, other 376, owner type 160, occupancy 8 and uncertain property identity 3. Counts overlap and do not measure recoverable facts or legal accuracy. The old 640 figure still has no verified origin. Source completeness, C35, unsupported assumptions and independent review remain unresolved.

## What the original proposal replay established (historical)

The offline checker consolidates the current automated candidates, applies working legal/property evidence, and calls the shared resolver for all 500 properties at `2026-10-01`. It records one diagnostic row per unknown rule/address result. It also checks the proposal's example pair and independently enumerates the four Boolean assignments for the correlation fixture below.

| Measurement | Verified result |
| --- | ---: |
| Rules / supplied properties / evaluated pairs | 54 / 500 / 27,000 |
| Working unknown results / properties affected | 680 / 339 |
| Properties hitting the enumeration limit | 0 |
| Unknowns by state | CA 472; NJ 114; MA 94 |
| Unknowns by category | Just cause 348; rent limits 252; deposits 42; screening 38 |

The working count is 680. The previously audited active snapshot has 704, and the pre-enrichment baseline has 741. This review does not establish the origin of 640; a different run is a hypothesis, not a verified explanation. Distinct working and published bundles can legitimately differ. Require identical inputs when two surfaces claim to show the same published run; do not publish working evidence merely to equalize their counters.

680/27,000 is 2.52%, and 339/500 is 67.8%. Neither is legal accuracy. The full pair total includes 22,019 not-applicable results, many outside jurisdiction. Even 680/4,981 = 13.65% among the remaining result states would be a result-distribution statistic, not an error rate.

The initial diagnostic distinguishes encountered missing-field memberships from the resolver's reported decisive question memberships. After the final correlation repair, decisive CO membership becomes **406**, while the other entries and unknown totals remain unchanged; the table below preserves the pre-repair comparison:

| Field | Encountered in unknown traces | Reported decisive for unknown results |
| --- | ---: | ---: |
| `other` | 552 | 372 |
| `co_date` | 394 | 394 |
| `owner_type` | 327 | 160 |
| `owner_occupied` | 315 | 8 |
| `year_built` | 18 | 30 |

Each column counts rule/address memberships, not distinct properties, records or questions; fields overlap. The second column uses the current resolver's question dependencies, including shared/interacting variables. It is not necessarily a subset of the first column: indirect year/CO interactions can introduce a decisive question absent from an individual raw trace. Audited resolver defects mean these are **reported dependencies, not independently certified materiality**. In particular, typing `other` cannot be assumed to eliminate 552 unknowns, and retrieving ownership cannot be assumed to resolve 315 owner-occupancy decisions.

The existing sensitivity replay removed only `presumed_inapplicable` exemption flags and produced 1,374 unknown results across 499 properties with zero enumeration limits. That is a previously verified policy-sensitivity result, not a newly corrected legal result set or the effect of repairing every assumption.

### Run identity and artifacts

The new run retains current presumed exemption/affordable defaults and the current one-year CO bound to reproduce the working baseline. It therefore reproduces known defects rather than certifying the outputs. Commit identity alone is insufficient because the working tree contains earlier changes.

| Identity | Value |
| --- | --- |
| Code commit | `4f2e38a` |
| Selected working code hash | `1719a11acd5d8324fd8d0f133c73e92ec280c4f939fdf2975199dcb0b77acced` |
| Evaluated rule bundle hash | `ea0ad6f257c7fa8150549e01b1adb902059ec9bfa5dc67d5cee21c3e3a453e63` |
| Working evidence bundle hash | `ce97a4443b40690b3ec403a213fbe847b450d4605c918ce4d3b66151646a8c92` |
| Address CSV hash | `0a5ebe8cd9c422f5999831f668cc787da5a22f3ca78ba94cb941a801e68af95d` |
| Cached geography hash | `163c7ccba816eeacf3c88990946003c1f295dcb9c2fd68ec5f1c1d575bf6b2fe` |
| Active pointer, comparison only | `snap-495f3f21cc8b` |

The code hash covers nine named engine/pipeline files listed in the checker, not every repository file. The rule/evidence hashes cover their parsed JSON serialization. This is a diagnostic identity, not the proposed complete immutable release manifest. The active snapshot is not the input bundle for this working replay.

Local ignored artifacts:

- [Checker](../.cache/audit/pasted-review-check.ts): run `node .cache/audit/pasted-review-check.ts` from the repository root.
- [Summary and correlation fixture](../.cache/audit/pasted-review-results.json).
- [680-row diagnostic unknown ledger](../.cache/audit/unknown-ledger-review.json).

These files are available locally but are excluded from git. Their questions and branches explicitly carry a diagnostic limitation; the ledger is not a production API or a certified legal proof. The documentation preserves the key results and fixture even if local cache files are later removed. No paid extraction, new enrichment retrieval, publish or deployment was run. The repeat-validation below reran the unit suite and diagnostic checker; browser/build checks were not repeated.

### Repeat validation of the same supplied proposal

The attachment hash still matches the reviewed file, and the diagnostic checker reproduces exactly the same selected working-code, rule, evidence, CSV and geography hashes. The current 680 unknowns, 339 affected properties, 27,000 pairs and zero enumeration-limit properties are unchanged. F29 still reproduces. `npm test` passes **31/31**, with zero failures or skipped tests.

Passing this suite is useful evidence about current behavior, but some expected outcomes explicitly encode disputed assumptions:

| Passing test | What it checks | Remaining gap |
| --- | --- | --- |
| `src/lib/engine/engine.test.ts:50` | A 1977 construction year makes the SF-style CO cutoff predicate true under the one-year bound | It does not independently establish that first CO could not be later than 1978. Repair the evidence model and change the test expectation where no valid upper bound exists; do not preserve this expectation merely to keep the suite green. |
| `src/lib/engine/engine.test.ts:147` | A missing shared-kitchen exemption with `presumed_inapplicable` produces applies and a presumption note | It verifies the shortcut, not evidence that the exemption is false. An evidence-only result should remain unknown when the missing exemption can change applicability. Test an explicitly hypothetical assumption separately, if retained. |
| `src/lib/engine/evidence.test.ts:46` | Two conflicting year claims leave an initially missing year missing | It does not test a known original fact plus contradictory credible claims, the F25 failure path. Add a known-original conflict fixture and assert that material alternatives cannot yield unsupported certainty. |
| Existing branch/resolution tests | Selected simple conditional outcomes and thresholds | They omit the XOR joint-condition case. The diagnostic checker still finds empty conditions for both opposing outcomes; add an independent branch-equivalence regression when repairing F29. |

Consequently, neither 31 passing tests nor all 27,000 evaluated pairs establishes that all relevant edge cases pass. Upgrade independent expectations alongside the implementation. The policy-testing research cited below likewise distinguishes executing rules from testing the individual conditions that can change decisions; it does not supply RuleTwin's legal expected answers.

Consensus's policy-testing paper record and its primary repository abstract were checked again. Scite's targeted DOI lookup still reports that account access needs a paid plan or active trial. No new Scite evidence was obtained. This repeat check adds no new finding number and does not claim any product repair.

### Final applied corrections

The original empty `when` XOR branches are replaced by exact grouped alternatives: applies for `(X=no AND Y=yes) OR (X=yes AND Y=no)`; not applicable for the equal-value combinations. `Branch.when` changes from a conjunction of marginal strings to a disjunction of conjunctions (`string[][]`). Marginal compression is retained only after checking that it selects exactly the corresponding admissible completion set. UI rendering follows the same AND/OR structure and exposes all alternatives when the preview is shortened.

Zero completions now produce `review_required`, no universal statements and a review action. Correlation-dependent questions can be identified even without a one-coordinate result flip; lack of such a flip no longer proves irrelevance. Known-original conflicting unit/year/CO facts become missing, with raw claims retained; municipality claims remain alternatives. A year conflict clears its derived CO proxy while preserving independent CO evidence. The 2/20-unit probe now returns unknown. New native regressions failed before repair and pass afterward; XOR/OR/AND branch matching uses an independent truth-table expectation.

Latest selected code hash is `4e991ee2d6b750d26ed5852cd80654472fa5cac563318080a2c1d1b63684e650`; evidence/rule/CSV/geography hashes remain as recorded above. The new checker still produces 680 unknowns on 339 properties, but reports 406 decisive CO memberships rather than 394. This does not validate the unrepaired one-year CO policy, presumed exemptions, affordability defaults, extraction completeness or all legal versions. The seven research abstract references and the primary XACML abstract were checked again; no research experiment or legal review was performed.

## Proposal-by-proposal validation

| Proposal | Verdict and required correction |
| --- | --- |
| Pin snapshot, code, evidence, rules, date and assumptions | Valid. Include input/source hashes and dirty code identity. Working and active metrics must be labeled separately; use the same bundle for comparable published surfaces. |
| Three classes: evidence-resolvable, conditional, irreducible | Useful, but not exhaustive as stated. Add resolution by valid logical proof without retrieval, and distinguish missing facts from uncompiled/disputed legal provisions. "Irreducible" means unresolved with present admissible evidence, not unknowable forever. |
| One ledger row per unknown rule/address | Valid. Derive it from the shared engine trace, include reason codes, fact/entity/date provenance, conflicts and assumption policy. Keep raw encountered fields separate from certified material blockers. |
| Replace generic `other` with typed predicates | Valid for actual source-backed clauses. Introduce only fields required by those clauses, with property/unit/owner/tenancy/transaction scope and validity. The proposed list of 19 fields is a candidate inventory, not 19 verified missing implementations. Re-extract automatically; never hand-write submission rules. |
| Separate protection coverage, event triggers and effect details | Useful only when each facet is independently supported by source text. A demolition-specific clause cannot prove a broader just-cause framework by removing its event trigger. Keep official result enums/schema unchanged. |
| Model CO dates conservatively | Valid principle; the sample policy contradicts it. Labeling a guessed one-year interval "derived" or "benchmark" does not authorize the assumption. Apply exact source operators, and retain material year-only uncertainty. |
| Skip ownership questions when a known unit guard excludes the exemption | Valid and already partly provided by Strong Kleene conjunction and resolution. Repair omitted/mis-extracted guards before adding a second simplifier. Unknown ownership remains material where the complete exemption can still be true. |
| Exact counts, intervals and lower bounds for units | Valid with source-specific semantics. A documented 5-or-more class can prove `units > 2` without exact count. Unsupported shorthand or parcel/nonresidential counts cannot establish relevant residential building/unit counts. |
| Affordable inventory absence does not mean false | Valid. A nonmatch becomes negative evidence only with demonstrated inventory completeness, correct entity matching and applicable date/coverage. Otherwise preserve unknown. |
| Keep conflicting evidence alternatives | Valid. Distinguish superseded claims from credible unresolved conflicts. Current F25 retains a known original value despite contradictory validated claims; warnings do not repair the decision. |
| Resolve legal versions before definite shortcuts | Required for potentially relevant rules. A proved wrong jurisdiction can short-circuit first. Authority ranking must compare the same subject/provision and dated validity; it is not a generic confidence-score override. |
| Retrieval priority = resolvable count × authority × confidence / cost | A planning heuristic, not a probability or guaranteed yield. Use estimated upper bounds and observed retrieval yield. Correct known unsupported certainty before maximizing reduced unknowns. Count verified material decisions after semantic repair. |
| Exact minimum question set | Optional later optimization. Distinguish a fixed set sufficient for all assignments from an adaptive next-question tree. Preserve correlations and answer availability. Exponential subset search is not bounded by the current completion cap; start with useful questions and no optimality claim. |
| Conditional decision matrices | Valid when exhaustive over admissible inputs and jointly correct. The F29 projection defect is now repaired with grouped joint conditions and finite truth-table checks; boundary equality and extraction fidelity still need source-specific coverage. |
| Always provide actionable branches | Too strong. Uncompiled legal text, contradictory evidence with no admissible model, and solver limits can prevent justified outcome branches. Display the review reason and useful evidence task without inventing a modeled outcome. |
| Six implementation slices | Reasonable outline. A diagnostic ledger can come first; proof-dependent features and enrichment priorities must follow shared semantic fixes. Keep the existing finite enumerator until measurements justify a solver replacement. |
| Zero unexplained unknowns, zero unsupported definite answers | Good release goals within a declared reviewed model and evidence bundle. A source route does not establish that the source exists or can answer. Explain unresolved/legal-review cases explicitly rather than inventing answers or demanding zero unknowns. |

### Corrections to the proposed examples

1. **The example is not a valid unknown pair.** `A0107` is a California/Los Angeles address. `r-b0e375` is an NJ rent-limit rule, associated with N.J.S.A. 2A:42-84.5. The actual pair returns `not_applicable`. Its category is `rent_increase_limits`, not the proposed `rent_increase`; the illustrated SF-style `1979-06-13` threshold is not a supported association with that pair. Populate an example from an actual ledger row with its real rule, clause and source. Do not copy this JSON into production.
2. **The policy example still guesses CO timing.** A CO interval such as `[1978-01-01, 1979-12-31]` for a 1978 build year uses the unverified one-year lag already identified in the audit. A policy name does not make it legitimate. The starter states year built is not CO and cutoff-year buildings should be unknown. Any benchmark proxy requires explicit authorization in supplied benchmark material; otherwise retain it only as a clearly hypothetical scenario, separate from evidence-only results.
3. **The date partition omits equality.** For the cited SF example, the starter says on or before `1979-06-13`; for LA it says on or before `1978-10-01`. A branch pair "before"/"after" leaves the exact day unhandled. Use the actual provision's `<=` versus `>` or other source-supported operator, with day-before/day/day-after tests. Do not reuse a cutoff operator across unrelated laws.
4. **Construction-year inference needs entity semantics.** A year genuinely identifying original construction after a relevant cutoff may establish that original occupancy was later, if that implication is supported. A renovation year, replacement building, parcel umbrella, addition or converted unit does not automatically prove the legally relevant first CO date. Conversely, early construction alone cannot establish a latest possible CO date.

## New confirmed defect: conditional branches lose correlations (F29)

**Historical reproducer; repaired in the final cross-check above.** This section preserves the pre-repair failure mechanism and expected outcomes.

`src/lib/engine/resolve.ts:307-313` groups completions by result, then records only which values each individual variable takes within that group. `merge` drops a variable if both its values occur. This operation preserves marginals, not the joint relationship that determines a result.

The independent fixture uses the allowed expression `(X OR Y) AND (NOT X OR NOT Y)` with no exemptions, known jurisdiction and enacted status:

| X | Y | Expected and observed direct result |
| --- | --- | --- |
| false | false | `not_applicable` |
| false | true | `applies` |
| true | false | `applies` |
| true | true | `not_applicable` |

The resolver correctly keeps the overall result unknown and checks four completions. It incorrectly emits both outcome branches with `when: []`. The real condition is `X != Y` for applies and `X == Y` for not applicable. The current UI (`src/components/rule-card.tsx:70`) falls back to "in some cases" for the empty conditions, so this fixture loses explanation rather than displaying an unconditional applies claim. Other marginal conditions are necessary constraints, not generally sufficient descriptions of an outcome.

**Repair:** retain joint completion tuples for small cases, or build a Boolean formula/decision tree and verify that it identifies exactly the completion set for each result. Compression must preserve the relation. If a concise expression cannot be proved, display possible outcomes without claiming a complete condition. Keep all decision logic in the shared engine, with CLI and website consuming the same representation.

**Acceptance:** for every admissible completion in the fixture, evaluating its branch formula selects exactly the direct engine result. Add correlated fact-domain fixtures, conjunction/disjunction and mutually exclusive alternatives. No non-universal outcome may receive a condition equivalent to true. Record whether a display condition is complete or only a necessary constraint. This is separate from F09, which concerns incorrect irrelevance/proof reasoning under correlated inputs.

## Research checked and its limits

Consensus was used to search and fetch relevant paper records. Scite's literature search and additional-tools discovery both rejected account access with a paid-plan/trial requirement; no Scite citation-context review was obtained. Primary-source checks continued independently.

| Research/source | What it supports | What it does not establish |
| --- | --- | --- |
| Sadowski and Chudziak, 2025, [On Verifiable Legal Reasoning](https://arxiv.org/abs/2509.00710); [fetched Consensus record](https://consensus.app/papers/on-verifiable-legal-reasoning-a-multiagent-framework-with-sadowski-chudziak/122a8e31126051808da4bfacae04b5af/) | Separating acquisition of legal knowledge from application, with explicit formal representations and verification, is a researched approach. This supports separate extraction-fidelity and evaluator checks. | Its tax benchmark results do not transfer to RuleTwin, prove completeness of housing clauses, or justify adding agents/frameworks to this small engine. |
| Xu, Shrestha and Shen, 2018, [Automated Coverage-Based Testing of XACML Policies](https://scholarworks.boisestate.edu/cs_facpubs/144/); [fetched Consensus record](https://consensus.app/papers/automated-coveragebased-testing-of-xacml-policies-xu-shrestha/389df5df7f73587ab182cd7db4321559/) | Its policy-testing experiment finds rule coverage inadequate for many defects and uses decision/MC/DC coverage plus mutation analysis. This supports testing guard effects, operators and omitted clauses rather than only executing every rule. | XACML is not housing law, and its results cannot certify every RuleTwin edge case. Source fidelity, legal versions and real property evidence remain separate obligations. |
| Supplied starter README, sections 3 and 4.1 | Unknown is valid for insufficient facts; owner names are excluded; year built differs from CO; the stated SF/LA cutoffs include their exact day. | It does not authorize a one-year occupancy lag, provide missing owner facts, or supply independent legal labels for every pair. |
| [Existing primary-source checks](RELIABILITY_PLAN.md#what-the-research-gets-right) | The prior plan records Census, PostGIS, solver and source-data constraints. The NJ handbook offers structured counts/classifications to investigate. | Availability of a schema or public source does not demonstrate successful retrieval or a correct entity join for these particular addresses. |

The paper checks used fetched abstracts/metadata and accessible primary abstract/repository pages. Full experiments were not replicated and this was not a systematic literature review. An additional incomplete-information paper was found, but its fetched record lacked an abstract; it is not used as evidence for the recommendations. Research supports methods, while the concrete validity judgments above come from source contracts and repository probes.

## What can be implemented, in order

1. **Repair shared semantics before optimizing unknown counts.** Remove unsupported exemption/affordable defaults and CO upper bounds; preserve conflicting evidence; repair disputed legal dates, correlated irrelevance and branch conditions (F03, F09, F17, F25, F29, plus the related audit findings). Validate fact ranges/raw strings. Add independent focused fixtures. A rising unknown count is acceptable if it removes unjustified certainty.
2. **Promote the diagnostic ledger into a shared projection.** Reuse `resolveProperty`, `BlockingFact`, evidence identities and traces. Add distinct cause codes for missing fact, unresolved geography, conflicting evidence, disputed legal version, uncompiled clause, and computation limit. Include potential sources, answer scope and whether conditions are verified. Do not create a second applicability evaluator for the UI or ledger.
3. **Add the smallest source-backed typed facts.** Inventory each current `other` occurrence and classify its actual source clause. Implement only required fields, source/entity/time contracts and validated hypothetical inputs; re-extract affected documents automatically. Separate source-proved coverage from triggers/effects where supported. Quarantine incomplete legal expressions instead of silently broadening protection.
4. **Gate evidence and releases.** Preserve competing claims and exact field-level source spans, verify legal identity/validity, and pin complete code/source/input identities. Enforce immutable snapshots and atomic publication validation. Use one dated path for report/change comparisons; validate proposal aliases separately. A diagnostic count match alone is not a release gate.
5. **Retrieve targeted facts and ask useful questions.** Start with corrected materiality, validate relevant residential units and original CO records, and require address/parcel/building/unit links. Investigate owner/exemption facts only where the full guard remains material. Cache inconclusive attempts. Ask users only questions they can legitimately answer, labeling those answers as hypothetical until verified. Useful questions come before exact minimum-question optimization.
6. **Replay finite independent acceptance cases and show bounded claims.** Keep native `node:test` and small deterministic generators. Use direct truth tables/reference evaluation, source/operator boundary cases, exact organizer affected sets and selected non-equivalent mutations. Replay all 500 supplied rows and save separately: software agreement, source-review coverage, evidence resolution, reference-label agreement and remaining uncertainty.

The existing enumerator completed this dataset and the exemption sensitivity run without limits. No evidence presently requires replacing it with SMT, a new database or a generic multi-agent runtime. If new typed domains cause measured limits, choose a solver only after defining correlation, date and unknown-result contracts and retaining an independent checker.

### Required edge cases and expected outcomes

| Case | Required result/check |
| --- | --- |
| Unknown exemption, all other exemption guards potentially true | Unknown when it can change applicability; no implicit false |
| Unknown ownership, known units outside exemption guard | No ownership blocker for that exemption; preserve the direct justified rule result |
| Credible conflicting building counts 2 and 20, rule `units > 2` | Unknown/disputed; cannot retain a definite applies merely because the original was 20 |
| Verified class interval `[5, infinity)`, threshold `> 2` | Predicate true, without inventing an exact count |
| Cutoff day-minus-one / exact day / day-plus-one | Match the source's inclusive/exclusive operator; no gap or overlap |
| Cutoff-year only, no relevant CO date | Unknown for a material CO test; no guessed one-year upper bound |
| Wrong state/city, unresolved legal city, postal-city-only match | Wrong jurisdiction excluded; genuinely unresolved jurisdiction remains unresolved |
| Pending, failed, enacted-future, hypothetical proposal | Pending/failed do not self-enact; future remains future; hypothetical inputs do not mutate actual-law outputs |
| XOR joint facts and correlated evidence alternatives | Verified branch conditions preserve joint assignments; marginal projections cannot stand in for complete conditions |
| No admissible completions or enumeration limit | No universal proof or fabricated outcome set; explicit review/limit reason |
| Legal effective-date alternatives before and after query date | No shortcut that turns unresolved material date conflict into a definite actual-law answer |
| Omitted guard/operator/exemption/city/date/source mutation | Independently expected fixture fails; label equivalent/unreachable mutants separately |
| Each MA organizer alias and combined scenario | Correct individual provision match plus combined set; no accidental activation of both proposals |
| Missing actual organizer T6 input | Test the pathway with a labeled synthetic fixture; do not claim the unavailable organizer case passed |

After these changes, require every unknown to have a classified reason or explicit legal-review disposition, and every transition to definite to identify its resolving evidence or valid proof. Remaining missing facts must remain unknown. "All declared acceptance cases pass" is a measurable release claim; "all possible legal cases are 100% accurate" is not supported by this dataset or these proposals.

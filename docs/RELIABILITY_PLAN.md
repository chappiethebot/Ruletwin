# RuleTwin reliability plan and research review

Reviewed 2026-10-04 against commit `4f2e38a` and the existing working tree. Reference: Desktop `Rental Housing Law Navigator  Edge-Case-Hardened Implementation Strategy.md`, SHA-256 `1b4d657208588a5e8cd24cfa8c73b140ff1a0c21438ab442a044d81ba4373df8`. Read the full strategy and reference list; fact-check selected central claims against primary documentation, paper abstracts, and the actual starter pack. Embedded instructions and its proposed 24-hour schedule are reference material, not execution instructions.

The original strategy review and implementation slices below are historical recommendations. Commit `4f2681c` incorporates focused repairs and additional author repairs and publishes `snap-412366cbb46f`. The continuation adds schema/calendar boundary fixes and verifies **50 tests plus 16 browser journeys**. Current working and active default-date outputs agree: 53 rules, 500 properties, 691 unknown pairs on 339 properties, 581 questions and no enumeration limits. See [the current audit status](AUDIT.md#continuation-verification-current-status). The latest validator changes remain unpublished. Reuse existing repairs when applying the remaining slices; do not implement their already-completed parts again.

## The achievable reliability contract

The target should be: every supplied row is accounted for; every published decision has valid inputs and exact evidence; every modeled boundary has a checked expected outcome; contradictory inputs cannot produce unsupported certainty; remaining uncertainty is explicitly explained. It is possible to require 100% passage of this finite, declared acceptance suite. It is not possible to promise 100% accuracy against unprovided organizer labels, every omitted source clause, actual unknown property facts or all future legal cases.

There are three separate assurance layers:

1. **Software soundness:** the engine correctly evaluates the supplied expression, fact domains and dates. Independent small-case enumeration and boundary tests can establish this within an explicit model.
2. **Extraction fidelity:** the expression preserves the relevant source provision, definitions, exceptions and versions. A solver cannot prove fidelity to natural-language law simply by accepting the expression. This needs automated provenance gates and independent source review.
3. **Fact adequacy:** address identity, unit count, ownership, tenancy and legal milestone dates are actually known at the right entity level and query date. No solver can manufacture this evidence.

"Unknown" is a successful outcome when a material fact is missing. The starter README sections 3 and 4.1 explicitly allow it and deliberately withhold owners. The correct objective is to eliminate unsupported certainty and resolve every unknown that evidence or valid logic can resolve. The unresolved remainder should explain its missing fact, evidence source and effect on the answer.

## What the research gets right

- Keep extraction separate from final applicability. RuleTwin already has the shared deterministic TypeScript engine and should retain it.
- Evaluate the entire supplied population offline. The current bundle executes 53 x 500 = 26,500 default-date pairs; extend that to supplied dates/scenarios and independently asserted outcomes.
- Model missing inputs by their effect on decisions. The existing resolver partitions domains and shares variables, so symbolic completion is already partly implemented.
- Use source-specific evidence, temporal versions, explicit precedence and immutable output bundles. These match audit F01-F04/F13/F19-F24.
- Add boundary, metamorphic and mutation checks. They detect different classes of defects; none independently establishes complete legal extraction.
- Keep network and LLM calls off the served sample-report path. The current snapshot-based local website already follows this principle.

The retrieved [LegalBench-RAG abstract](https://arxiv.org/abs/2408.10343) supports precise relevant-span retrieval. [LGMT](https://arxiv.org/abs/2605.23965) describes invariance-based testing of LLM reasoning. The [temporal statutory QA paper](https://arxiv.org/abs/2605.23497) reports staleness/recency problems and supports filtering by legal time. These are relevant methods, not evidence of RuleTwin accuracy.

The abstracts for [verifiable legal reasoning](https://arxiv.org/abs/2509.00710), [L4L](https://arxiv.org/abs/2511.21033), [SIRNA](https://arxiv.org/abs/2608.00396), and [conformal risk control](https://arxiv.org/abs/2606.29054) match the cited topics. This check confirms titles and broad applicability, not all experimental claims or replication. OpenReview's LawShift link returned a browser-verification page; its detailed claims remain unverified here. The MassGIS pages had search-visible official descriptions but direct opens failed; their data availability has not been demonstrated for the missing sample properties.

## Corrections before adopting the strategy

| Proposal/detail | Assessment | Repo-specific correction |
| --- | --- | --- |
| Python primary engine, PostGIS, SMT, two decoders, provenance graph and signed outputs | More infrastructure than needed to repair current defects | Keep the existing TypeScript engine, Node tests, installed Zod and content hashes. Add tools only for a measured limitation |
| `notyeteffective`, `inforce`, `algorithmicrentsetting`, `conflictflag`, `sourcedocid` in examples | Not the actual external schema | Use `not_yet_effective`, `in_force`, `algorithmic_rent_setting`, `conflict_flag`, `source_doc_id`; freeze the starter's serializer contract |
| Pending result before jurisdiction in pseudocode | Would return a Massachusetts proposal for a California property | Reject a provably wrong jurisdiction first. Specify whether pending/future outputs describe potential coverage or present coverage, and test the selected contract |
| Preserve organizer names as actual `team_rule_id` | Stronger than the supplied schema requires | Schema explicitly permits team-owned unique IDs. Preserve organizer IDs in tests/alias mapping, with explicit source/citation matching and ambiguity errors |
| Hash source spans into conceptual rule IDs | Confuses provision identity and revision identity | Stable concept ID; separate version/content hash. Source formatting changes should not create a new legal concept |
| Two geographic paths are independent | Incomplete: both can reuse the same approximate coordinate and TIGER source | Use polygon recomputation as consistency checking; obtain independently corroborated address/parcel identity for ambiguous matches |
| Force exact city cohort counts before release | Useful diagnostic, unsafe way to fill unresolved rows | Compare counts and require every discrepancy to be explained. Never assign a city from a target count or postal-city guess |
| Zero covering polygons means failed/unincorporated | Combines distinct states | Verified unincorporated location can rule out city laws; an unmatched location stays unknown. A boundary point can have multiple candidates |
| Four-state logic replaces three-state evaluation | Would change the repository invariant and many contracts | Retain Strong Kleene truth. Add explicit conflict metadata and disputed alternatives; outcome-relevant conflicts map to unknown |
| Whitespace-normalized quotation is an exact exported quote | Offsets refer to original text, not a normalized reconstruction | Match canonically, then store the exact original substring and original offsets for every field |
| Highest-authority source always wins | Authority alone does not select subject/version/time | Check the same provision, legal event, effective interval and source identity. Keep unresolved material alternatives; do not use source rank as a silent fact selector |
| Unknown local coverage leaves state answer definitely applies | Can overstate which rule governs where an evidenced yields-to-local relationship exists | Report definite underlying protection separately from unresolved governing level. Enumerate both relationship outcomes rather than force applies/superseded |
| Solver table contains only sat/unsat | Omits solver timeout/unknown and the consistency gate | Check admissible-domain feasibility first; any undecided/limited query keeps uncertainty and cannot prove applies |
| Two engines agree, therefore legal conclusions are correct | Shared incorrect expressions and facts still agree | Keep differential testing independent, and separately review extraction and facts against sources |
| 100% atomic true/false/unknown and mutant kill coverage | Some branches or mutants are unreachable/equivalent under real constraints | Report feasible coverage, documented unreachable cases and a fixed critical non-equivalent mutant set. Do not silently exclude difficult mutants |
| Every unresolved fact has one minimal question | Compound or correlated uncertainty may need several facts | Offer a useful decisive question/set. Claim exact minimality only if actually computed and verified |
| The 24-hour schedule is a guaranteed completion estimate | No measured basis for that estimate in this working tree | Use acceptance-driven implementation slices; count verified repairs, not elapsed hours |

[Census documentation](https://www.census.gov/programs-surveys/geography/technical-documentation/complete-technical-documentation/census-geocoder.html) confirms coordinates are interpolated approximations, not proof that a building exists at the returned point. [ST_Covers](https://www.postgis.net/docs/manual-3.5/en/ST_Covers.html) includes boundaries; [ST_Contains](https://postgis.net/docs/manual-dev/en/ST_Contains.html) excludes a polygon-boundary point. These support the strategy's boundary distinction, but not its implied independence guarantee. [Census ZCTA guidance](https://www.census.gov/programs-surveys/geography/guidance/geo-areas/zctas.html) describes generalized ZIP representations, so ZCTA membership cannot establish an individual parcel's city.

[Z3's own guide](https://microsoft.github.io/z3guide/programming/Z3%20Python/Introduction/) documents an `unknown` solver result. Adding a solver must not turn a timeout or unsupported theory into a legal conclusion. The recommendation to retain finite enumeration first is an engineering inference from the current code and measured dataset, not a claim that all future predicates are discretely enumerable.

## New checks against this implementation

The offline probe uses synthetic fixtures for failure paths and the actual saved dataset for counts. It performs no retrieval or publication.

| Probe | Outcome | Consequence |
| --- | --- | --- |
| Two validated, same-building unit claims: 2 and 20; original CSV fact 20; rule requires more than 2 | Conflict logged, original 20 retained, result applies | Conflicting evidence can still leave unsupported certainty; audit F25 |
| Parse year `9999` and units `2e1` | Both treated as known; units becomes 20 | Future/sentinel year rejection and accepted numeric syntax are not implemented; audit F26 |
| Count missing NJ units filled exactly from `nU` shorthand | 88 rows, e.g. `6B-20U-G` becomes exactly 20 | Need source-specific codebook or corroborating structured apartment count; audit F27 |
| Resolve `MA-ALG-P1` and `MA-ALG-P2` | Both return both H.5222 and S.2983 | Combined T4 set can look correct while proposal identity is not distinguished; audit F28 |
| Disable only presumed-inapplicable exemption flags, then run current constraint resolver on all 500 working properties | 1,374 unknown results across 499 properties, 1,412 questions, zero enumeration limits | Conservative corrections increase unknowns; current completion capacity still handles this particular modified dataset |

The original working run has 680 unknown results across 339 properties. The conservative exemption probe produces 1,374, an increase of 694. This retains the existing affordability/CO/unit assumptions and source versions, so it is neither a legally certified corrected dataset nor a complete strict-evidence evaluation. It demonstrates why promising zero unknowns would contradict the data.

The fact inventory is 212 missing construction years, 32 missing normalized unit counts (all MA), and 500 missing owner-type, owner-occupancy and owner-portfolio facts. These are property counts; they are not independent counts of blocked rule decisions.

## Resolve unknowns by cause, not by guessing

| Cause | What can be implemented | What legitimately remains unresolved |
| --- | --- | --- |
| Missing year built | Retrieve exact parcel matches from authoritative local assessor/building sources where accessible; keep construction year separate from occupancy | Current NJ adapter found 106 matching parcels with no year; retrying the same empty field is not a solution. Do not infer year from neighborhood/nearby buildings |
| Missing unit count | Use documented intervals if sufficient for a threshold; otherwise retrieve structured apartment/dwelling count with parcel/building linkage | Exact building units do not automatically equal parcel-wide units or residential-only units; incomplete fields stay unknown |
| CO date / cutoff year | Prefer first relevant occupancy record, matched to building/unit and construction event; separate official evidence from the organizer's explicit year approximation | Missing actual CO cannot be replaced by a one-year lag bound. Same-cutoff-year sample records must remain unknown unless an exact relevant date exists |
| Owner type/occupancy/portfolio | Simplify exemption guards using known property type/unit limits. Ask targeted questions when still material | Owner facts are deliberately excluded. User answers are hypothetical, not authoritative findings; no owner-name enrichment is proposed |
| Affordable/subsidized status | Preserve explicit documented restriction evidence and its scope; otherwise ask or keep unknown if decisive | Absence of a subsidy keyword is not proof of no deed restriction; subsidies and legal restriction types may have different meanings |
| Unresolved city | Validate full address/parcel identity; preserve all corroborated alternatives; accept result only when every valid candidate yields it | ZIP, street existence, house-number prefix and target cohort totals alone do not establish location |
| Unsupported `other` predicate | Re-extract complete source guards; add only typed predicates needed by actual clauses, such as a specific transaction or notice fact; give each a source-grounded identity | Do not rename a compound sentence to a Boolean and pretend its components are known. Shared keys must not conflate different units, dates or legal subjects |
| Legal date/status dispute | Extract official enacted text plus relevant history through the automated pipeline, preserve claims and select only a supported dated version | Conflicting equally applicable sources require review/conditional outcomes; actual preemption is not solved by a confidence score |
| Limit or inconsistent model | Memoize/reuse threshold cells, fix infeasible-domain handling and correlated dependencies; add an optional test-time SMT checker only if needed | No admissible completion is a data/model contradiction, not universal applicability; timeouts do not justify certainty |

Official public metadata supports two specific avenues worth investigating. The [NJ MOD-IV handbook](https://www.nj.gov/treasury/taxation/pdf/lpt/modIVmanual.pdf), PDF pages 29 and 32, documents a structured apartment-count field and a 5-or-more apartment classification. Validate those fields rather than assuming every `nU` substring is an exact count. The [MassGIS parcel description](https://www.mass.gov/info-details/massgis-data-property-tax-parcels) and [parcel standard](https://www.mass.gov/doc/standard-for-digital-parcels-and-related-data-sets-version-3/download) identify assessor year/unit fields; units can include nonresidential units. These are source-schema opportunities, not demonstrated successful retrievals for the 32 missing MA records.

The official [LA occupancy dataset catalog](https://catalog.data.gov/dataset/building-and-safety-certificate-of-occupancy) identifies an occupancy-record source. It does not establish complete historic first-occupancy coverage. Existing audit results found six inconclusive LADBS attempts. Absence of a record remains inconclusive; property-level RSO status also cannot certify every unit in that property.

For the challenge's year approximation, record a named benchmark policy and version in the trace. Do not label a derived interval as a retrieved CO. One shared engine may consume either an explicit benchmark approximation or authoritative facts; the same decision code and serializers must serve both. Actual legal milestone queries cannot silently inherit the benchmark approximation.

## Minimal implementation slices and their acceptance checks

### 1. Restore conservative evidence and proof behavior

Change `facts.ts`, `engine.ts`, `evidence.ts`, and `resolve.ts` at their shared boundaries. Remove automatic unknown-exemption-to-false conversion from evidence-only decisions. Represent CO/affordability assumptions explicitly. Validate real calendar dates, field/type/operator combinations, finite exact values, interval order, subject identity and confidence. Represent a legitimate unbounded interval explicitly in JSON rather than silently converting Infinity to an unlabeled null. Use a calendar bound tied to source capture/context for construction years rather than blindly rejecting a valid historic fact because it exceeds an earlier query date.

Keep every conflicting source claim. If credible unresolved alternatives cross a decision threshold, evaluate those alternatives or leave the fact unknown with conflict metadata; do not keep an old value as automatically authoritative. Fix legal-version disputes before the base-result shortcut. Handle zero admissible completions explicitly, and test correlated variables before labeling them irrelevant.

**Acceptance:** unknown exemption remains unknown when decisive; wrong jurisdiction remains omitted; decisive unknown owner data is retained; genuinely irrelevant missing facts do not affect results; conflicting units 2/20 cannot prove `units > 2`; irrelevant conflicts can retain a result only with a valid proof; chosen dates 2025/2027 at query 2026 stay conditional; zero completions yield no universal statement; limit exhaustion yields no proof. Reject sentinel/malformed values without erasing the raw strings. Correcting uncertainty is allowed to increase unknown counts.

### 2. Protect extraction, publication and snapshot identity

Reuse Zod and `findQuote`. Add a field evidence reference containing document/hash/start/end and store the original matched substring. Preserve the logic source through merging. Add a small section/definition dependency inventory; quarantine unresolved cross-references or empty/uncompiled guards. Preserve prior accepted candidates when a rerun fails. Improve automated extraction prompts for CO cutoffs and legal versions; never hand-edit submission rule records.

Publication must validate the official record schema and a stronger internal schema, quote spans/hashes, unique property IDs, referenced rule IDs, processing status and evidence. Stage complete content before changing the active pointer. Hash the complete semantic bundle, including evidence, source identity, tests and actual code/compiler version. Keep nondeterministic build timestamps outside semantic identity, or freeze them when reusing an existing snapshot. Identical publication is a no-op; any changed input creates a different identity. Validate an existing snapshot instead of overwriting it.

**Acceptance:** mutate a quote/operator/source hash/evidence value or duplicate an ID and publication rejects it before any official output changes. Changing relevant evidence changes snapshot identity. Repeating a release cannot overwrite it or make previous point to itself. C08/C34/C35 can close only after source-backed automated corrections and regression verification. A partial extraction cannot silently become a complete release.

### 3. Make dated reports and changes use the same inputs

Use one shared date-aware evidence/version/resolution entry point for reports and changes. Support `valid_from <= as_of < valid_to` where source data establishes boundaries; retain unknown historical validity when only current status is documented. Add guarded dated effects only for actual phased amounts/provisions needed by the corpus. Compare the union of before/after rule IDs, both gains and losses, result changes, relevant effect changes and conflict changes. Keep hypothetical enactment an in-memory scenario that cannot update actual-law lookups.

Replace broad organizer-ID matching with explicit validated citation/provision aliases. It is acceptable for two alias entries to intentionally target one consolidated provision if supported, but accidental many-to-many matches must be detected. Use one safe document-ID contract that supports `T6A` throughout extraction and source loading.

**Acceptance:** T1-T5 have exact set assertions, not only totals. CA = 250; Hoboken = 40 and Jersey City = 50, Newark excluded; NJ = 140 with the intended 90-address conflict set at the specified date; hypothetical MA = 110 while actual laws remain pending; failed measure = empty. Assert the named before/after results for each property, inclusion of the exact effective day, correct proposal matching and no baseline mutation. Add reverse-date loss, repeal/end interval, effect-only amendment and differently dated evidence fixtures. A synthetic T6-shaped fixture tests the pathway without pretending it is the missing organizer ordinance.

### 4. Build a finite assurance runner with independent expectations

Retain `node:test`. Use simple deterministic generators instead of adding a test framework first. Enumerate every extracted literal/guard at below/on/above, missing, malformed and conflicting values, and every source-supported time boundary at day-before/day/day-after. Label synthetic fixtures separately from real dataset rows. Cover known jurisdiction, another city, another state, unresolved and multiple-candidate locations. Add source ordering/formatting, irrelevant fact, postal-city-only and hypothetical-isolation transformations.

Build a tiny independent reference interpreter for the restricted predicates, used only by tests. It must not import the production comparator, temporal selector or resolver. Compare small finite domains directly, including shared facts, negation and interval endpoints. If independent implementation agrees with wrong extracted logic, source-review checks must still fail; that is why these checks remain separate. For current expressions, this is smaller than replacing the engine with Python/SQL/SMT.

Create an explicit critical mutation list: comparison inclusivity, AND/OR, exemption polarity, omitted guard, city/state scope, pending/failed activation, shifted date, reversed precedence and altered citation. Each must have a fixture expected to fail for a documented reason. Distinguish equivalence/unreachability review from killed mutants; do not claim automatic proof that all possible mutants are equivalent or detected.

Replay all 500 properties against all rule versions at the default and supplied test dates plus specified hypothetical overlays. Save a machine-readable summary with failures, unknown causes, conflicts, limits, source/input/code hashes and exact affected sets. Use official or independently adjudicated expectations where available; count self-consistency separately. Capture the known 37-case limitations rather than presenting 96.9% as population accuracy.

**Acceptance:** no unexplained differential disagreements; every feasible declared boundary/guard fixture checked; every selected non-equivalent critical mutant detected; zero malformed exports; every supplied row evaluated; all failures and review-only rules visible. Independent extraction review must cover each provision, not merely 19 properties. Actual T6 and organizer scoring remain explicit unavailable-input gates until supplied.

### 5. Resolve targeted evidence gaps and expose a usable result

After steps 1-4, rank genuine missing facts by which decisions they can change. Fetch only accessible authoritative fields needed for those decisions; use exact address/parcel/building/unit linkage and query-date validity. Cache successful and inconclusive requests so the same empty field is not repeatedly queried. Require review or additional identity evidence for ambiguous joins.

Show the strongest proved protection, unresolved governing rule/amount, material missing facts, used evidence and assumption policy. Ask useful conditional questions, with answers validated against offered alternatives. Make "no law found in processed material" different from "no law applies" and show section/corpus coverage limits. Save/download either a clearly labeled pinned result or a genuinely replayable receipt with all required input identities and a verifier.

**Acceptance:** every previously unknown decision that becomes definite identifies the fact or proof that resolved it; no missing value is filled merely to reach a target count. Show unresolved questions when authoritative sources do not answer them. Network-disabled replay produces the same frozen sample outputs. Full visual/accessibility and authenticated cross-account download tests cover the missing meaningful journeys.

## Subsequent pasted-proposal validation

[SOLUTION_REVIEW.md](SOLUTION_REVIEW.md) evaluates the subsequent proposal in detail. Its original diagnostic reproduced 680 working unknown results; the continuation now reproduces 691 under the updated bundle. Its recommendations mostly agree with this plan, but its example identifiers, category, CO assumption and strict-before/after boundary need correction. Encountered fields must not be presented as independently proved blockers: the current resolver reports 376 decisive `other` memberships versus 558 encountered ones, under retained assumptions and audited limitations.

The review adds audit **F29**: conditional branches lose joint relationships by projecting satisfying completions onto individual variables. An XOR fixture correctly produces two applies and two not-applicable assignments, but both branches have empty conditions. Add joint-tuple or equivalent formula verification to step 1 and to the assurance runner. For every admissible completion, the branch representation must select exactly the independently expected outcome. If only necessary constraints are available, label them accordingly instead of implying a complete conditional matrix.

Keep the ledger as a projection of the existing shared engine. Introduce only source-backed typed facts and re-extract automatically. Prioritize semantic corrections before using resolver materiality for enrichment planning. Uncompiled/disputed law, zero admissible completions and computation limits may require a review disposition without a justified outcome set; an "always actionable" requirement cannot authorize fabricated branches. Consensus-backed method research and Scite's unavailable account access describe the earlier review; current repairs are recorded at the top of the audit.

## Which event requirements control

The later [submission readiness review](SUBMISSION_READINESS.md#two-different-briefs-are-available) found a second public participant PDF in the Desktop brief's linked starter folder. It explicitly removes the hour-16 task and requests T1–T5, a live demo and one-page method note without the original scoring/video requirements. Neither document proves which governs this event; confirm that externally while completing the shared correctness work. Treat actual T6/official scoring as conditional gates, not automatically required repairs under the no-scoring variant. This does not close the demonstrated extraction, uncertainty, provenance, change or replay findings.

## Release checklist and precise claims

- [ ] A frozen, complete input/code/source manifest is attached to the run.
- [ ] Every expected row is ingested once and every official export record passes schema validation.
- [ ] Every executable clause has exact, source-specific supporting spans and dependency disposition.
- [ ] Unsupported/conflicting material facts cannot produce definite evidence-only conclusions.
- [ ] Every declared modeled threshold, exemption and temporal boundary has independent expected tests, with documented infeasible cases.
- [ ] T1-T5 exact sets and result states pass; actual T6 is tested only when supplied.
- [ ] Selected critical mutations fail; reference-interpreter disagreements are zero.
- [ ] Independent source review resolves or explicitly quarantines omitted clauses and conflicting versions.
- [ ] Replay works without network and no existing snapshot can be overwritten.
- [ ] Reference-set agreement, execution coverage, factual resolution and independent legal accuracy are reported separately.

These gates are not all passed. Regression coverage now includes joint branches, contradictory completions, property conflicts, disputed dates, change losses, proposal matching, numeric contracts, CLI setup and schema/calendar boundaries. The demonstrated snapshot overwrite and publication-validation defects have repairs; complete archived-code replay and semantic source assurance remain unproved. Current unknowns are 691 on 339 properties, with 394 reported decisive CO memberships. Unsupported exemption/CO/affordability assumptions, source/effect completeness, historical versions, C35 and independent legal review remain open. Report "100% of the declared acceptance cases pass" only with the actual report and scope. Do not report "100% legal accuracy" or "all unknown facts solved" without supporting evidence.

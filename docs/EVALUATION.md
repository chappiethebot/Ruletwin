# Evidence-resolution evaluation

Generated 2026-10-04T10:38Z by `node scripts/measure.ts`. Default as-of 2026-10-01 unless a case says otherwise.

**Reference set:** 37 cases in `data/reference/reference.json`, Claude (AI assistant) on 2026-10-04, against corpus documents and sample rows. NOT independent of the system's author, NOT reviewed by counsel, NOT the organizers' answer key.
Small, hand-picked and not independent. Use it to compare configurations, not as an accuracy claim. Passing tests and these numbers do not mean 100% legal accuracy.

## Reference set by configuration

| Config | Evaluated | Definite answers | Definitive-answer accuracy | Resolution coverage | Correct | Wrong | Overclaim | Conflicting outputs | Unresolved | Correctly indeterminate | No matching rule |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| previous_release | 31 | 21 | 0.905 | 0.704 | 19 | 1 | 1 | 1 | 6 | 3 | 0 |
| baseline_kleene | 37 | 29 | 0.862 | 0.781 | 25 | 3 | 1 | 0 | 4 | 3 | 1 |
| constraints | 37 | 29 | 0.862 | 0.781 | 25 | 3 | 1 | 0 | 4 | 3 | 1 |
| enrichment | 37 | 33 | 0.939 | 0.969 | 31 | 1 | 1 | 0 | 0 | 3 | 1 |

- *Definitive-answer accuracy* = correct ÷ definite answers given (overclaims and wrong answers count against it).
- *Resolution coverage* = correct ÷ cases whose reviewed outcome is definite.
- `previous_release` = the official lookups of commit 17631bd. Only 2026-10-01 cases can be evaluated from it.
- `baseline_kleene` already includes this task's engine fixes (numeric `in`, CO-date bound, geocode house-number validation). It is not the previous release.

## Per-case results (enrichment)

| Case | Types | Expected | Got | Verdict |
| --- | --- | --- | --- | --- |
| C01 | normal | applies | applies | correct |
| C02 | precedence | superseded | superseded | correct |
| C03 | normal | not_applicable | not_applicable | correct |
| C04 | normal | applies | applies | correct |
| C05 | normal | applies | applies | correct |
| C06 | normal | applies | applies | correct |
| C07 | precedence | superseded | superseded | correct |
| C08 | cutoff_year | indeterminate | unknown | correctly_indeterminate |
| C09 | normal | applies | applies | correct |
| C10 | normal | not_applicable | not_applicable | correct |
| C11 | missing_property_data | indeterminate | applies / unknown | correctly_indeterminate |
| C12 | missing_property_data | indeterminate | unknown | correctly_indeterminate |
| C13 | missing_legal_version, conflicting_sources | applies | applies | correct |
| C14 | missing_legal_version, temporal | not_yet_effective | not_yet_effective | correct |
| C15 | temporal | not_yet_effective | not_yet_effective | correct |
| C16 | temporal | applies | applies | correct |
| C17 | missing_document | applies | applies | correct |
| C18 | temporal | not_yet_effective | not_yet_effective | correct |
| C19 | temporal | applies | applies | correct |
| C20 | normal | applies | applies | correct |
| C21 | boundary | not_applicable | not_applicable | correct |
| C22 | incorrect_record, boundary | not_applicable | not_applicable | correct |
| C23 | incorrect_record | applies | applies | correct |
| C24 | missing_document | applies | applies | correct |
| C25 | uncertain_identity | applies | applies | correct |
| C26 | conflicting_sources, temporal | not_applicable | not_applicable | correct |
| C27 | temporal | pending | pending | correct |
| C28 | temporal | pending | pending | correct |
| C29 | incorrect_record, uncertain_identity | not_applicable | not_applicable | correct |
| C30 | uncertain_identity | applies | applies | correct |
| C31 | uncertain_identity | applies | applies | correct |
| C32 | missing_document | indeterminate | no_rule | no_matching_rule |
| C33 | normal | applies | applies | correct |
| C34 | conflicting_sources | applies | applies | correct |
| C35 | conflicting_sources, temporal | indeterminate | applies | overclaim |
| C36 | temporal | not_yet_effective | not_yet_effective | correct |
| C37 | normal | not_applicable | applies | wrong |

## All 500 properties (2026-10-01)

| Config | Unknown rule results | Properties with ≥1 unknown | Decisive questions (total) | Mean questions per open property |
| --- | ---: | ---: | ---: | ---: |
| baseline_kleene | 565 | 215 | – | – |
| constraints | 565 | 215 | 385 | 1.79 |
| enrichment | 511 | 207 | 369 | 1.78 |

## Clarification (masking experiment)

For 151 CA properties with a known year built, the year and CO bound were hidden. The system asked its decisive questions, and an oracle answered from the hidden values.

- Questions asked: 149 (mean 0.99, max 1 per property).
- Properties fully resolved on the masked facts: 149/151.
- Oracle could not answer: 2. The true value is itself an interval straddling a threshold, so the system rightly stays conditional.
- Agreement of definite results with the full-data run: 1 over 7238 rule results.

## Evidence quality

- 310 records: {"inconclusive":114,"validated":196}. Validated records with span + URL + retrieval time: 196/196.
- By adapter: nj-modiv-parcels {"validated":0,"inconclusive":106,"rejected":0}; municipal-assessor-roll {"validated":190,"inconclusive":0,"rejected":0}; ladbs-cofo {"validated":0,"inconclusive":8,"rejected":0}; njgin-geocoder+nj-municipal-boundaries {"validated":2,"inconclusive":0,"rejected":0}; sdmc-codified-history {"validated":2,"inconclusive":0,"rejected":0}; census-zcta-place-2020 {"validated":2,"inconclusive":0,"rejected":0}.

## Retrieval latency (first fetch; cached afterwards)

| Adapter | Calls | Median ms | p95 ms | Measured |
| --- | ---: | ---: | ---: | ---: |
| sdmc-pdf | 2 | 1241 | 1241 | 2 |
| nj-modiv-parcels | 106 | 281 | 620 | 106 |
| ladbs-cofo | 8 | 688 | 10002 | 8 |
| census-zcta-place-2020 | 2 | 168 | 168 | 2 |
| njgin-geocode | 2 | 616 | 616 | 2 |
| nj-municipal-boundaries | 2 | 644 | 644 | 2 |

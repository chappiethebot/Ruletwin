# HANDOFF

**Integrated (2026-10-04, after the review):** patch `.cache/audit/v5-alignment-fixes.patch` applied on main (supplied-text citation verification, protected T1–T5). Exports keep manifest IDs D037/D059 for the three research rules (schema: doc_id from the manifest), still `source_in_supplied_corpus: false`. New `logic.unverified_effective_date`: Berkeley ch. 13.63 date (2026-01) comes only from S037, so its 40 answers are conflict-flagged for human review (guide §9). Active snapshot `snap-eea786560def`; results, T1–T5 and changes.json unchanged. 56/56 tests, 16/16 e2e. UI: minimal redesign (one search on the landing page, Inter only, confidence as a quiet meta line).

**Latest independent review (2026-10-04):** read `docs/V5_CHALLENGE_REVIEW.md` first. Main baseline `46e7c41` / `snap-96c4ceacda7b`: 48 rules, 511 unknowns on 207 properties, zero replay mismatches. The new pack's 65 files are byte-identical. While Claude Code edits main, fixes are prepared separately in `.cache/v5-review-46e7`, patch `.cache/audit/v5-alignment-fixes.patch`; do not overwrite concurrent changes. The isolated repair publishes `snap-3e8d479e4ac6`, keeps research IDs S037/S059, pins actual supplied-text eligibility/hashes, and protects the fixed T1–T5 cases from extension collisions. It passes 55 tests, typecheck, lint, production Webpack build, independent schema/CSV/quote checks and 16 browser journeys. Default-bundler and deployed-release verification remain to run after integration. Current penalty count is 17 non-null, nonempty fields; the earlier count of 18 does not match the consolidated exports. C35/C37, field provenance, unsupported assumptions and coverage/history gaps remain open. Scorer/key/T6 are not requirements.

**v5 update (2026-10-04):** v5 participant pack (`MIT-hackathon-PARTICIPANT-PACK-CLEAN-NO-HOUR16`, byte-identical data) is the default input. Submission = rules.json, lookups.json, changes.json (T1–T5 only), live demo, one-page `docs/METHOD_NOTE.md`. Every lookup explanation ends with citation, source doc, retrieval date and as-of; rules carry `source_in_supplied_corpus` (false for r-2631aa, r-8c87fb, r-faf046: link-only copies, no citation credit). New: audit view + `/api/audit/<id>`, `submission/audit_log.json`.

Current state: v4 extraction published and released publicly. Active snapshot `snap-96c4ceacda7b`. Local `main` holds full history and full supplementary texts; the public GitHub repo holds one clean commit (see "Public repository").

## Verified (2026-10-04)
- `npm test` 50/50; typecheck, `npx eslint scripts src`, `npm run build` clean; `npm run e2e` 16/16 (1440 px + 390 px, incl. clarification loop).
- Hosted mode (`HOSTED_DEMO=1 npm run start`): all pages 200, Spanish view renders, `/login` shows the read-only notice, `/app/saved` redirects.
- Exports: 48 rules (official schema + `penalty` extension; 17 nonempty penalties), every headline `quoted_span` exact (gates), 500/500 addresses; T1 250, T2 90, T3 140 (90 conflict flags), T4 110 (P1→S.2983, P2→H.5222), T5 0.
- Lookups 2026-10-01: applies 3373, superseded 289, unknown 511 (207 properties; mean 1.78 decisive questions each), not yet effective 140, pending 440.
- Reference set (37 cases, AI-reviewed, not independent): 31/33 definite answers correct; misses C35 (Berkeley March 2026 date absent from corpus) and C37 (NJ 30-year statute modeled as an exemption: modeling judgment). C32 has no separate rule after v4 merged LA Resident Protections into the RSO just-cause record. Not an accuracy claim.

## What changed in this pass
Prompt v4 (penalty, Spanish, key values, strict just-cause definition, per-category records, exact cutoff dates); named-ordinance keys + subset merging; supplementary pages limited to their manifest jurisdictions (Santa Ana NS-3090 and S037-based San Diego dropped per user instruction; San Diego enacted via official SDMC evidence); typed predicates for statutory property-type phrasing; self-referential conditions removed; resolver enumerates only undecided groups (0 enumeration limits); CO presumption = year built (participant guide §4.1); renter view EN/ES; per-answer confidence; county in jurisdiction stack; `scripts/ingest.ts` (extension cases); `HOSTED_DEMO`; publication gates accept redistribution stubs.

## Commands
`npm run geocode` → `node scripts/extract.ts` (Claude CLI login or `ANTHROPIC_API_KEY`) → `node scripts/enrich.ts` (Python + `pypdf`) → `npm run publish` → `node scripts/measure.ts` → `npm run build; npm run start` → `npm run e2e`.
Extension (stretch goal, not part of T1–T5): `node scripts/ingest.ts --file <txt> --jurisdiction "City, ST"`.

## Public repository (github.com/chappiethebot/Ruletwin, public)
Remote `main` = orphan branch `public-release` (one commit, author `42741718+chappiethebot@users.noreply.github.com`). Article texts S037/S059 are stubs (`scripts/public-stubs.ts`); only the active snapshot is included. To update it later:
```
git checkout public-release
git checkout main -- .          # bring current files
node scripts/public-stubs.ts supplementary/text/S037.txt supplementary/text/S059.txt data/snapshots/<active>/S037.txt data/snapshots/<active>/S059.txt
# remove non-active snapshot dirs, set active.json "previous" to null, then:
git add -A; git -c user.email=42741718+chappiethebot@users.noreply.github.com -c user.name=chappiethebot commit -m "..."; git push
git checkout main
```

## Open / external
- Live link: deploy the public repo on Vercel with env `HOSTED_DEMO=1` (user account needed).
- Live demo / optional videos: `docs/DEMO_SCRIPT.md` (own output and validation only).
- Organizers will not share `score.py` or the answer key (v5); no official score exists. T6 removed in v5.
- Known gaps (README): Santa Ana NS-3090, Hoboken rent control, Newark rent control have no corpus text.
- Audit open items: F16, F18–F24 (docs/AUDIT.md).

## Env var names
ANTHROPIC_API_KEY, EXTRACT_MODEL, STARTER_DIR, STRICT_EXEMPTIONS, ALLOW_PARTIAL, HOSTED_DEMO, BASE_URL / BROWSER (e2e) — all optional.

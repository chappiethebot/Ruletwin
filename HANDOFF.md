# HANDOFF

Current state: v4 extraction published and released publicly. Active snapshot `snap-96c4ceacda7b`. Local `main` holds full history and full supplementary texts; the public GitHub repo holds one clean commit (see "Public repository").

## Verified (2026-10-04)
- `npm test` 50/50; typecheck, `npx eslint scripts src`, `npm run build` clean; `npm run e2e` 16/16 (1440 px + 390 px, incl. clarification loop).
- Hosted mode (`HOSTED_DEMO=1 npm run start`): all pages 200, Spanish view renders, `/login` shows the read-only notice, `/app/saved` redirects.
- Exports: 48 rules (official schema + `penalty` extension; 18 with source-stated penalties), every `quoted_span` exact (gates), 500/500 addresses; T1 250, T2 90, T3 140 (90 conflict flags), T4 110 (P1→S.2983, P2→H.5222), T5 0.
- Lookups 2026-10-01: applies 3373, superseded 289, unknown 511 (207 properties; mean 1.78 decisive questions each), not yet effective 140, pending 440.
- Reference set (37 cases, AI-reviewed, not independent): 31/33 definite answers correct; misses C35 (Berkeley March 2026 date absent from corpus) and C37 (NJ 30-year statute modeled as an exemption: modeling judgment). C32 has no separate rule after v4 merged LA Resident Protections into the RSO just-cause record. Not an accuracy claim.

## What changed in this pass
Prompt v4 (penalty, Spanish, key values, strict just-cause definition, per-category records, exact cutoff dates); named-ordinance keys + subset merging; supplementary pages limited to their manifest jurisdictions (Santa Ana NS-3090 and S037-based San Diego dropped per user instruction; San Diego enacted via official SDMC evidence); typed predicates for statutory property-type phrasing; self-referential conditions removed; resolver enumerates only undecided groups (0 enumeration limits); CO presumption = year built (participant guide §4.1); renter view EN/ES; per-answer confidence; county in jurisdiction stack; `scripts/t6.ts`; `HOSTED_DEMO`; publication gates accept redistribution stubs.

## Commands
`npm run geocode` → `node scripts/extract.ts` (Claude CLI login or `ANTHROPIC_API_KEY`) → `node scripts/enrich.ts` (Python + `pypdf`) → `npm run publish` → `node scripts/measure.ts` → `npm run build; npm run start` → `npm run e2e`.
T6: `node scripts/t6.ts --file <txt> [--test <t6.json>] [--url <url>]`.

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
- Videos (team, demo, technical): see `docs/DEMO_SCRIPT.md`.
- No `score.py` / dev key in the pack: ask organizers; then `python score.py ...` on the dev set for the video.
- Known gaps (README): Santa Ana NS-3090, Hoboken rent control, Newark rent control have no corpus text.
- Audit open items: F16, F18–F24 (docs/AUDIT.md).

## Env var names
ANTHROPIC_API_KEY, EXTRACT_MODEL, STARTER_DIR, STRICT_EXEMPTIONS, ALLOW_PARTIAL, HOSTED_DEMO, BASE_URL / BROWSER (e2e) — all optional.

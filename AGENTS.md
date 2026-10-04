<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RuleTwin — operating instructions

Address-first rental-housing law navigator (Hack-Nation × RealPage challenge 02). Runs locally on `localhost`.
Legal information, not legal advice.

## Start of session
Read `HANDOFF.md`, `docs/DECISIONS.md`, `git status`, `git log --oneline -15` before changing anything.

## Invariants (do not break)
- One engine: `src/lib/engine/*` is the only applicability logic. CLI exports and the website import it. Never duplicate decision logic in UI code.
- Engine files use relative `.ts` imports (no `@/`) so `node` runs them directly.
- Strong Kleene logic. Missing data is `unknown`, never `false`. Year built is a year-precision proxy, not a certificate-of-occupancy date.
- Pending bills never self-enact; failed measures never apply; future enacted rules are `not_yet_effective`.
- Every exported `quoted_span` is an exact substring of the source document (`findQuote`). No stitched quotes.
- Rules come only from automated extraction (`npm run extract`). Never hand-write rule records for submission.
- Postal city is not legal city. Legal city = Census Geocoder incorporated place; unmatched = unresolved (`unknown`).
- Do not edit starter-pack files or organizer test files.

## Map
- `src/lib/engine/` types, evaluator (`engine.ts`), facts, quote matcher, change tracking, tests.
- `scripts/` CLI: `geocode.ts`, `extract.ts`, `publish.ts`, `config.ts`.
- `data/geocode.json` cached geography; `data/extraction/` candidates + ledger; `data/snapshots/<id>/` immutable snapshots; `data/snapshots/active.json` pointer.
- `submission/` official exports (rules.json, lookups.json, changes.json).
- `supplementary/` team-fetched public pages for link-only sources (labelled secondary).

## Commands
`npm test` · `npm run typecheck` · `npm run geocode` · `npm run extract` · `npm run publish` · `npm run dev`

## Secrets / git
Secrets only in `.env.local` (ignored). Stage explicit files; never commit `.env*`, `.cache/`, the starter pack, or `data/local/`.
No force-push, no history rewrites.

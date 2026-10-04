# RuleTwin — Rental Housing Law Navigator

Which rental-housing rules apply at this address on this date, and what is about to change?
Built for Hack-Nation × RealPage, Challenge 02. Runs locally on your computer.

**Legal information, not legal advice.** Machine-extracted from the supplied corpus; not reviewed by counsel.

## What it does

1. **Extract**: an LLM processes available corpus text and outputs rule candidates with typed coverage conditions. Headline quotes are checked character-for-character against the source. Link-only references and clause-level provenance remain coverage gaps; see the audit.
2. **Resolve**: each sample address is geocoded with the US Census Geocoder to its legal incorporated place. The postal city is not trusted: one "Cambridge" address is legally in Boston.
3. **Apply**: a deterministic evaluator (`src/lib/engine`) tests coverage with true/false/unknown logic, effective dates, pending/failed status and local-vs-state precedence.
4. **Explain**: the website shows each rule with its status, the exact source sentence, the reasoning trace and the facts that would decide an "unknown".
5. **Track change**: supplied cases T1–T5 plus dated comparisons, split into definitely and possibly affected addresses. Extension cases for new ordinances use the same pipeline (see below).

## Setup (Windows, PowerShell)

Requirements: Node.js 24+ (`node --version`), Git. Verification used Node 25.9.0; the declared Node 24 minimum has not been exercised. For re-running extraction you also need one of these:
- an Anthropic API key in `.env.local` (`ANTHROPIC_API_KEY=...`), or
- the Claude Code CLI logged in (`claude` once interactively, then `claude -p "say hi"` should reply).

```powershell
cd C:\Users\ritay\Desktop\Ruletwin
npm install
```

Put the v5 participant pack folder `MIT-hackathon-PARTICIPANT-PACK-CLEAN-NO-HOUR16` next to this README (the earlier, byte-identical `participant-final-no-hour16 3…` download is also detected).
If it lives somewhere else, set `STARTER_DIR` in `.env.local`.

## Run the website

```powershell
npm run build
npm run start
```

Open http://localhost:3000. The public demo works without an account. Saving properties and reports needs a local account: use "Sign in" → "Create one". Accounts live in `data\local\ruletwin.db` on this computer only.

## Pipeline commands

| Step | Command | Notes |
|---|---|---|
| Geocode addresses | `npm run geocode` | Cached in `data/geocode.json`; re-runs only fetch missing rows |
| Extract rules | `node scripts/extract.ts` | Resumable; LLM responses cached in `.cache/llm` |
| Extract a few docs | `node scripts/extract.ts --only D048,D069` | |
| Pre-enrich evidence | `node scripts/enrich.ts` | Needs Python + `pypdf` (San Diego code PDFs); public sources only, cached; writes `data/evidence/` |
| Publish snapshot + exports | `npm run publish` | Validates, evaluates all 500 properties, writes `submission/` and switches `data/snapshots/active.json` |
| Measure vs reference set | `node scripts/measure.ts` | Writes `data/reference/results.json` and `docs/EVALUATION.md`; small AI-authored set, not an organizer score |
| Check without publishing | `npm run publish -- --dry-run` | Runs validation and population evaluation without changing exports or the active pointer |
| Unit/semantic tests | `npm test` | Engine logic, quotes, account isolation |
| Browser journey | `npm run e2e` | Needs the site running; uses your installed Edge/Chrome |

Outputs: `submission/rules.json`, `submission/lookups.json`, `submission/changes.json` (also downloadable from the site).

## Policies

- In PowerShell, set `$env:STRICT_EXEMPTIONS='1'` before `npm run publish` to keep untestable exemptions **unknown**. The default treats them as disclosed presumptions. This switch only changes exemption handling; CO and affordability presumptions still remain.
- Publication refuses to write anything if the schema, quotes, IDs, extraction ledger or evidence fail validation. Snapshots are content-addressed and never overwritten.

## Spanish renter view and confidence

Every property report starts with an "In plain words" summary for renters; **Ver en español** switches it to Spanish (`?lang=es`). Each rule card shows a confidence level derived from the evidence path (high = observed facts and an official source; medium = presumption, constraint proof, secondary source or modest extraction confidence; low = open or disputed), with the reasons on hover.

## Extending to a new jurisdiction or ordinance (stretch goal)

The v5 brief has no hour-16 release; the five change tests T1–T5 are fixed at kickoff. The same pipeline can still take one new ordinance or jurisdiction with a single command (PowerShell, repo root):

```powershell
node scripts/ingest.ts --file C:\path\to\ordinance.txt --jurisdiction "City, ST" --url "<official URL>"
```

It runs automated extraction on the new text (same prompt, schema and exact-quote validation), builds an extension change case ("2026-10-01 vs the day after the new rule's effective date", or a supplied test JSON via `--test`), and publishes through the normal gates. Extension cases appear on the website's Changes page only; the official `submission/changes.json` always contains exactly T1–T5. This is also the live "automated extraction" demonstration.

## Hosted read-only demo (live link)

`HOSTED_DEMO=1` disables local accounts (serverless disks are not persistent); lookups, evidence, changes, the rule library and the Spanish view all work. On Vercel: import the GitHub repo, set the environment variable `HOSTED_DEMO` = `1`, deploy. The committed snapshot under `data/snapshots/` and `submission/` is bundled (see `next.config.ts`).

## Coverage and limits

- 3 states, 10 cities (Santa Ana extracted only; no sample addresses), 6 categories, 500 sample properties. Not every US address.
- Year built is not a certificate-of-occupancy date. The implementation presumes CO within the build year, so a cutoff inside that year stays unknown; observed CO evidence takes precedence. The guide's cutoff-year warning does not verify that bound. `CO_LAG_YEARS` in `src/lib/engine/facts.ts` makes the assumption more conservative.
- Owner facts stay missing. Default untestable-exemption and affordability presumptions can still produce unsupported definite answers; strict exemption handling addresses only part of this gap.
- As-of queries use available legal dates and dated evidence. Complete historical versions, end dates and historical property facts are not established.
- Hoboken and Jersey City algorithmic-ban text was not in the corpus. One public law-firm alert (manifest D037, same URL) and one news article (manifest D059) were captured once each into `supplementary/`, labelled secondary, and used **only** for the jurisdictions listed in their manifest rows.

### Known gaps: laws named in the brief whose text is not in the corpus

The corpus and manifest were searched (file names, URLs, link-only rows, alternate spellings). No rule is produced for these, and no citation is invented:

| Law | What the corpus contains |
|---|---|
| Santa Ana algorithmic rent-setting ban, Ord. NS-3090 (Apr 2026) | Only link-only news rows D086 (OCBJ) and D087 (PublicCEO). The official Santa Ana texts D084/D085 cover rent stabilization and just cause only. |
| Hoboken rent control (rent leveling) | Only link-only ecode360 rows D032–D034 (publisher terms under review). |
| Newark rent control | Only link-only ecode360 rows D070–D072. |

Also: the Berkeley ch. 13.63 March 1, 2026 effective date mentioned in the participant guide does not appear in the corpus copy of D001, so the date dispute it describes cannot be detected (reference case C35).
- The organizers do not share `score.py` or the answer key (v5 participant release). Validation shown here is our own: unit and browser tests, exact-quote and schema gates, T1–T5 outputs and an AI-reviewed reference set (`docs/EVALUATION.md`), which is not an official score.
- Citations: the metric counts supplied corpus text only. Publication checks the distributed manifest, actual text, URL and exact headline offsets and pins eligibility plus the supplied-text hash in the snapshot. Three research rules (team captures S037/S059) are exported under the link-only manifest IDs D037/D059 and marked `source_in_supplied_corpus: false`. Older snapshots without verified metadata show an unverified citation warning. Exact headline support does not prove every compiled field.

## Project map

See `AGENTS.md` (instructions and invariants), `HANDOFF.md` (status) and `docs/DECISIONS.md` (decisions).

## Verified release and remaining work

The 2026-10-04 v5 review checked 48 rules and all 500 properties: 24,000 pairs, 511 unknown results on 207 properties and zero published-result mismatches. The new pack's 65 files are byte-identical to the earlier participant download. Detailed checks, remaining work and the separately prepared repair are in [V5_CHALLENGE_REVIEW.md](docs/V5_CHALLENGE_REVIEW.md).

The isolated repair passed 55 tests, typecheck, lint, a production Webpack build and 16 browser journeys. Its snapshot is `snap-3e8d479e4ac6`; the reviewed main-checkout baseline was `snap-96c4ceacda7b`. Check the active pointer after integration. Default-bundler verification and a public live deployment remain release steps. Missing source clauses, unsupported presumptions and independent legal verification remain open.

# RuleTwin: complete implementation brief for Claude Code

Copy this entire document into Claude Code, or save it in the project root and tell Claude to read it and implement it. This is a build instruction, not a request for another plan.

## Mission and constraints

Build RuleTwin, a functional, polished address-first rental-housing legal intelligence website. I am a beginner using Windows and Claude Code in VS Code. Two people have approximately ten elapsed hours. Make practical implementation decisions yourself, explain only what I need to act on, and work through the milestones below. Do not stop after scaffolding or a visually convincing mockup.

The goal is a deployed SaaS MVP with real sign-in, private saved properties, address/date analysis, citations, missing-fact explanations, a rule library, and change-impact comparison. Production legal certification, nationwide coverage, billing, team invitations and automated legal monitoring are outside this release. Do not claim production readiness merely because a build passes.

Our challenge brief specifies automated extraction from 87 documents, 500 sample properties, six categories, three states, ten extraction cities/nine sampled cities, six change tests, and an official Python scorer. Extraction /25, address coverage /20, citations /15 and change tracking /15 are automated. Missing applicable rules incur a higher penalty; unknown is valid when facts are missing. The actual starter files, schema, guide and scorer are authoritative. Do not infer their interface from this brief.

Read the supplied research reports and challenge brief if present. The report called RuleTwin-Housing-Research-and-MVP.md supersedes the older research attachment's unreliable numbered bibliography. Never assume my ChatGPT attachments are automatically available in your workspace. Inventory files first. If the starter pack is missing, give me one specific request for the folder containing corpus, properties, guide, schemas, development answers, change cases and score.py. Continue useful independent work while waiting. Do not invent corpus records, legal claims or scoring results.

## 1. First 30 minutes: inspect, Git, contracts

1. Inspect the current directory, existing application, AGENTS.md/CLAUDE.md, git status, branch and recent history. Respect existing work; do not overwrite or reset it.
2. Check Git, Node/npm and Python versions, shell type and available credentials by existence only. Never print secrets. Use PowerShell-compatible instructions for me; do not assume bash, WSL, Unix utilities or Docker.
3. If outside any repository, initialize a new repository with main. Do not create a nested repo inside an existing one. If Git identity is missing, ask for name/email and set repository-local identity; do not invent either or change global settings.
4. Create .gitignore before adding files. Ignore .env files except .env.example, secrets, dependencies, build outputs, caches, downloaded raw data by default, local logs containing personal data, and model responses. Track source, lockfile, migrations, schemas, tiny clearly synthetic test fixtures, instructions and sanitized score summaries. Share corpus/output artifacts through the event-approved route; record hashes/paths in the repo.
5. Inspect actual scorer/schema and run its supplied baseline if available. Do not modify official scoring or ground-truth files. Record exact commands.
6. Freeze a minimal internal model and official-export adapter after inspecting the contract. Internal richness must not break official fields/enums.
7. Deploy a basic shell early if hosting is configured. An early deployment is a connectivity check, not task completion.

Initial commit: `chore: initialize project contracts and agent handoff`.

## 2. Architecture decision

Default for a new project:

- Next.js App Router + TypeScript, one application and one package manager.
- Tailwind CSS, restyled shadcn/ui primitives, Lucide icons.
- Zod or an equivalent already-installed schema validator.
- Supabase Auth and Postgres for real user sessions and private saved properties/reports.
- Pure TypeScript deterministic evaluator imported by both server routes and CLI batch export. No duplicated browser/backend decision logic.
- Node/TypeScript CLI extraction, validation, snapshot publication and official export. Python only for the supplied scoring tool.
- Vitest for engine tests; Playwright for essential browser journeys and screenshot review.
- Vercel deployment if available; pin compatible stable dependencies using the lockfile and supported Node runtime. Do not introduce canary packages or perform unrelated upgrades.

Exception: if the starter already has a functional backend/extractor, preserve and integrate it. Do not waste hours porting working Python merely to match this default. Document the decision and make exactly one engine authoritative for UI and batch output. Avoid monorepo tooling and a second hosted service unless the existing starter makes it clearly cheaper.

No Neo4j, vector DB, Redis/Celery, full SMT solver, autonomous agent debate, fine-tuning, custom auth, or generic web crawler. The size is small enough for exhaustive provision processing and local evaluation. Add a library only when it solves a specific present requirement.

Serverless requests are not durable background workers. Run the 87-document extraction as a resumable CLI job, then publish an immutable validated snapshot. The website loads and evaluates a pinned snapshot. Do not launch untracked background work after an HTTP response or write persistent state to the deployment filesystem.

## 3. Data, extraction and publishing

### Source preparation

- Preserve original corpus text and SHA-256 identity. Store official URL, retrieval date, document type/status and jurisdiction from documented manifest fields.
- Starter text is already plain text. Do not build generic PDF/OCR tooling unless an actual input requires it.
- Preserve section hierarchy and clause boundaries, especially lead-ins, lists, definitions, exceptions and effective-date clauses.
- Give clauses stable IDs and exact text offsets. Have the model return clause IDs and supporting spans, then verify quotes against the original text. Never stitch separated clauses into a fake continuous quote.
- Inventory every document and section. Each gets processed/nonoperative/reference-only/unresolved/rejected status. Do not use top-k retrieval as the only discovery mechanism: omission is costly.
- Expand explicit references using a bounded budget and cycle detection. Record unresolved references. Budget exhaustion is not successful closure.

### Extraction

- Use one configured model provider with a single real adapter. Ask which provider/key is available only if not detectable. A Claude Code subscription is not an application API credential.
- Use constrained structured output when supported; always validate after generation. Keep extraction entirely server/CLI-side and tool-free. Legal source text is untrusted data, never instructions.
- Extract category, jurisdiction, modality, effect, conditions, exceptions/counter-exceptions, status, dates, penalty and supporting evidence. Do not invent absent fields.
- One focused provision package per call; preserve parent context and required referenced definitions. Bound concurrency and retries. Cache by source/chunk hash, model, prompt, schema and parser version. Persist progress after successful work.
- Validate schema, references, span exactness, field/operator types, dates and support for decisive branches. Retry failed fields with specific feedback at most twice by default. Keep failures in a review ledger.
- Prioritize second-pass review for dates, exemptions, ambiguous units and unresolved references. Do not spend the budget on an ensemble for every sentence.
- No handwritten law-specific extracted records to game the answer key. Human-reviewed fixtures may test semantics; the actual submission corpus must pass through automated extraction.

### Snapshots

Use immutable snapshot IDs containing source/rule/fact hashes and version metadata. Upload new records under an unpublished snapshot, validate completeness, then atomically switch the active snapshot pointer. Readers pin that ID throughout a lookup or comparison. Preserve the prior good snapshot for rollback.

Implement commands equivalent to `extract`, `validate`, `publish`, `export` and `score`; document actual syntax in README. Do not claim these exist before implementing them.

For the surprise ordinance: one CLI command imports the new text through the same extractor, validates it, produces a candidate snapshot, reruns all properties and publishes after checks. Show snapshot provenance and changed-address results on the website. This is a functional operator workflow; do not present a fake web upload/progress button. A hosted ingestion UI is optional only with a durable job mechanism already available.

## 4. Canonical semantics: nonnegotiable

RuleVersion: stable norm ID, version ID, jurisdiction ID, category, status, effective start/end-exclusive, condition tree, guarded effects, evidence-backed precedence relations, source spans, extraction version and validation flags.

PropertyFact: property/entity ID, field, normalized/raw values, known/missing/conflicting/not-equivalent state, unit, precision, source and available validity dates. Keep supplied identifiers stable.

Evaluation: property ID, selected date, snapshot ID, coverage truth, legal status, resulting guarded effects, effect completeness, missing facts, predicate trace, relation/conflict trace and source IDs.

Use recursive ALL/ANY/NOT and allowlisted typed comparisons. Never evaluate generated source code. Reject malformed syntax; unsupported legal predicates produce an explicit unresolved/unknown result, not a dropped condition.

Strong Kleene truth values:
- FALSE AND UNKNOWN = FALSE.
- TRUE AND UNKNOWN = UNKNOWN.
- TRUE OR UNKNOWN = TRUE.
- FALSE OR UNKNOWN = UNKNOWN.
- NOT UNKNOWN = UNKNOWN.

Missing database data is not evidence that a legal condition is false. Preserve unknown exemptions. Do not treat an empty extracted condition list as universal applicability unless the source supports it.

Distinguish coverage, legal status, precedence and effect completeness. A rule can apply while a computed amount remains unavailable. Store CPI-based formulas as typed data or safe display text; never invent CPI or evaluate formula strings.

Use dates as calendar dates, not timezone-shifted instants. Test inclusive/exclusive wording and normalize to [start, end-exclusive). Unknown effective start does not mean always active. Pending bills stay pending even after their proposed effective date; failed measures do not reactivate. Future enacted rules are not yet effective. Sunset, amendment and repeal replace only the affected provisions.

A law may depend on tenancy/transaction date rather than simply query date. Missing historical facts or unsupported retroactivity must be disclosed. MVP historical queries use historical law with supplied property facts unless historical facts actually exist; label this limitation visibly.

Construction year is not certificate-of-occupancy date. Do not infer owner type, owner occupancy, owner portfolio size or unit count from proxies. Year precision may be insufficient at a date cutoff. Normalize documented sentinel values without treating genuine zero/false as missing indiscriminately.

Use supplied jurisdiction identifiers when documented. Otherwise resolve legal geography with cached official geocoder/geography information. Never trust postal-city text as legal jurisdiction or use a map marker as proof. Preserve San Francisco city/county canonical identity. For unsupported addresses, return unsupported or ambiguous rather than borrowing nearby facts. The complete first release supports the supplied sample, not all US addresses.

Precedence is evidence-backed, dated and provision-specific. Neither “city always wins” nor “state always wins” is valid. Do not suppress the entire state statute. Potential preemption stays a conflict flag until supported. Preserve multiple compatible obligations. Prevent relation cycles/unbounded recursion.

Separate actual change from hypothetical pending-law simulation. Compare baseline and target snapshots/dates with the same facts. Diff coverage, status, effect/formula, precedence and conflict, not just IDs or summaries. Show definitely affected versus possibly affected due to missing facts; call conservative sets possible, not statistical probabilities. Do not assume unchanged UNKNOWN labels prove no possible semantic change. Detect changed rule dependencies/guards too. At 500 properties, reevaluate all of them.

Negative findings must distinguish affirmative source-backed absence, no match in the supplied corpus, and unknown. No “no protections exist” assertion from a failed search.

## 5. Real SaaS persistence and security

Keep account scope simple: one private personal workspace per authenticated user. Organization invitations/roles are a later release.

Minimal tables, adapting to starter:
- snapshots, published rule_versions, source_spans and public sample properties;
- saved_properties(user_id, property_id, created_at), unique per user/property;
- saved_reports(user_id, property_id, snapshot_id, as_of_date, result_json, created_at);
- private fact_overrides(user_id, property_id, field, value, provenance), only if the scenario feature needs durable storage;
- extraction_runs and audit events restricted to operator/admin access.

Public source law/sample records may be read-only under explicit policies. Private customer data must use RLS with authenticated ownership checks for SELECT/INSERT/UPDATE/DELETE, including WITH CHECK on writes. Derive user ID server-side; never trust client user_id. Test two separate users for cross-user denial, including direct API/database requests.

Use current Supabase SSR guidance and server-verified identity; do not authorize from an unverified cookie. Every server mutation requires authentication and authorization even if its page is protected. Service credentials stay server/operator-side and must not bypass ownership protections in customer routes. Never expose them in NEXT_PUBLIC variables. Prevent personalized response caching across users.

Implement sign-in/sign-out and an actually usable account-creation flow. Configure local and deployed redirect URLs. Preserve provider email-confirmation requirements and show accurate states; never secretly disable auth safeguards to make a demo pass. I may need to create accounts, provide keys or authorize hosting: give exact short instructions, never ask me to paste secrets into chat. Use ignored .env.local and deployment settings.

Allow a public read-only sample demo without login. Saving requires an account. If auth credentials are absent, the public demo can work but clearly report SaaS persistence as blocked. Never substitute localStorage or fake authentication while claiming real accounts.

User-supplied fact changes are hypothetical/private overlays, never silently overwrite official scoring facts. Reset must restore the original. Reports pin their snapshot so later law changes do not rewrite saved evidence.

Escape source text; no unsafe HTML injection. Validate http/https citation URLs. Bound inputs/payloads and expensive actions. Do not expose a public LLM extraction endpoint or arbitrary server URL fetching. No tenant ranking, protected-attribute inference, legal-evasion advice or rent recommendations. Include “Legal information, not legal advice” and corpus scope/as-of date near results.

## 6. Product and visual design

Design a professional, calm SaaS workspace. Give it a distinctive, finished visual hierarchy without ornamental complexity.

Tokens: ivory background #F7F6F2; white cards; charcoal #242621; secondary #626762; deep teal #006B67; restrained amber and crimson states. Check final contrast. Use a locally bundled accessible sans-serif such as the project's existing font, and IBM Plex Mono or a system monospace for citations/date metadata. Avoid remote font requests becoming a build dependency.

Sidebar approximately 232px; compact top bar; 28–32px page heading; body 15–16px; comfortable 44px primary controls; consistent 4/8px spacing; 10–14px radii; subtle borders, restrained shadows. Light theme first; dark theme deferred. No gradients, glowing AI icons, giant dashboard headings, fake logos, fake statistics or decorative charts.

Only show working navigation: Check address, Saved properties, Changes, Rule library. A compact overview is optional after these work. Do not add disabled Team/API/Billing pages or empty dashboards to simulate SaaS breadth.

Routes and journeys:
1. `/`: short landing page with a clear address-first explanation and “Explore sample properties.” Real coverage summary, three concrete benefits, methodology and disclaimer. No fabricated customer testimonials or legal guarantees.
2. `/app/check`: searchable sample addresses with labeled suggestions, exact date input and analyze action. Show matched address, jurisdiction and property facts before the result. Keep property ID/date in URL; avoid exposing private address details unnecessarily.
3. `/app/properties/[id]?asOf=YYYY-MM-DD`: summary counts calculated from actual results, six category sections, rule cards, needed-fact checklist and save action. Unknown/pending/future/conflict all distinct with labels and icons, never color alone.
4. Evidence drawer: exact source text, separate linked definition/exception spans, citation, source URL, retrieval date, rule effective interval and snapshot. Do not copy the provision's coverage cutoff into its effective date. Keyboard accessible; Esc closes; focus returns to trigger. Full-screen sheet on small screens.
5. Reasoning expansion: render actual deterministic trace with true/false/unknown conditions. Explain which missing facts matter. Template summaries; do not re-ask an LLM whether a rule applies. False exemption and unknown exemption are not equivalent.
6. `/app/changes`: select event/scenario or two exact dates; show definite/possible impact counts, affected-property table, before/after cards and exact changed predicate/effect with both source versions. Date input is authoritative. A small accessible timeline can supplement it.
7. `/app/rules`: real search and category/jurisdiction/status filters; open original evidence and structured data. Include extraction review status, not uncalibrated percentages.
8. `/app/saved`: user-owned properties and saved reports; persistence must survive reload and another authenticated device/session.
9. `/login` and documented callback: functioning authentication, helpful errors and redirect back to intended action.

Every button must perform its stated action. Every asynchronous page needs loading, empty, error and partial-result states. No fabricated stage progress; use real events or a neutral loading label. Every unsupported address explains the coverage boundary. No “compliant” score or “all laws verified” badge.

Desktop: results left, useful facts summary right, evidence drawer on demand. Mobile: stacked cards, collapsible navigation, no horizontal page overflow. Table horizontal scrolling is acceptable inside its container. Accessible names, visible focus, screen-reader status updates, adequate contrast and reduced-motion handling are mandatory basics.

Map is a stretch, not a dependency. If the core is complete early, add client-loaded MapLibre with public sample coordinates, valid attribution and a permitted tile source; no paid key required by default. Table remains fully usable without the map. Omit map rather than ship broken tiles, guessed points or extra unsupported network dependencies.

## 7. Tests and acceptance

Implement focused semantic tests, not tests that simply copy implementation logic. Use independently specified fixtures.

Required tests:
- All three-valued operators; missing and conflicting facts; decisive false branch with another unknown branch.
- Threshold k−1/k/k+1; date D−1/D/D+1; sunset; year-only precision; pending never self-enacts.
- Exception, exception-to-exception, guarded alternative amount, unsupported predicate, wrong jurisdiction.
- Exact quote/source-version match; malformed extraction rejected; swapped city and corrupted quote detected.
- Same frozen engine/rules/facts/config gives identical canonical output; exclude volatile timestamps from result hashes.
- Mutation tests: comparator flip, omitted exemption, shifted date and null-to-zero. Explain any equivalent mutant.
- Public read-only route and authenticated saves; two-user isolation; scenario facts do not affect official batch facts.

Competition cases, using actual files and expected format:
T1 CA future versus effective dates; also test the exact effective day.
T2 Hoboken/Jersey City restrictions must not leak to Newark.
T3 NJ future rule plus possible local conflict.
T4 MA bills pending, with separate hypothetical impact.
T5 struck MA measure does not become a rent cap; expected empty affected set.
T6 unseen Cambridge ordinance processed automatically. It is released at event hour 16: if unavailable, run a labeled rehearsal and leave a documented post-release command. Never claim the actual T6 passed without its input.

Run the official scorer after the first end-to-end slice, complete dataset, change engine and final freeze. Preserve full reports and commit sanitized summaries. Do not modify scoring files, fabricate scores or overfit addresses. Record key disagreements separately with supporting sources; the challenge key is not counsel-certified.

Browser acceptance: address search → date result → source drawer → unknown explanation → change comparison → sign-in/save/reload → export. Verify desktop and mobile at approximately 1440px and 390px, keyboard interaction and no console/server errors. Use screenshots to inspect the actual rendered interface; fix clipping, dense text, empty states and contrast. Never claim browser QA from a successful build alone.

Export rules.json, lookups.json and changes.json exactly as the official schema requires, through the same evaluator as the website. Downloads must contain actual data. Proof JSON includes snapshot, rule/fact versions, date, evidence and trace; hashes identify content, they do not certify legal truth.

## 8. Ten-hour delivery gates and Git commits

Treat hours as budget caps, not permission to leave core incomplete. Stop cosmetic exploration when a gate is late. Keep extraction running while building independent UI/engine work. If a human teammate is available, assign extraction/data ownership to them and UI/engine to the other person; freeze the shared schema first. Do not have two people editing shared engine/schema files concurrently.

| Time | Deliverable | Commit intent |
|---|---|---|
| 0:00–0:30 | Inspect starter, Git, contracts, handoff | chore: initialize project contracts and agent handoff |
| 0:30–1:15 | Designed app shell and early deployment; start small extraction | feat: add address-first workspace shell |
| 1:15–3:00 | Sources, extraction/cache/validators; start full corpus run | feat: extract source-grounded versioned rules |
| 3:00–4:45 | Typed facts, jurisdiction, evaluator, trace and first official exports | feat: evaluate property rules with dates and unknowns |
| 4:45–6:00 | Connected address report, evidence drawer, needed facts | feat: connect address reports and evidence receipts |
| 6:00–7:00 | Change engine, comparison UI, tests | feat: explain property-level law changes |
| 7:00–8:00 | Real auth, RLS and persistent saved properties/reports | feat: add private saved properties and reports |
| 8:00–9:00 | Scorer fixes, semantic tests, browser/mobile QA | fix: resolve evaluation and end-to-end failures |
| 9:00–10:00 | Deployment verification, actual exports, README/demo/handoff | chore: finalize verified deployment and handoff |

Account provisioning can start in hour one while UI work continues; do not discover missing services only at hour seven. If a gate overruns, cut map, overview, animation, theme switching and convenience features. Do not cut evidence, missingness, official exports, working data connections or authentication isolation while claiming completion.

Commit after each coherent checked milestone and meaningful fix; do not wait until the end. Stage explicit files or inspect the staged diff before committing. Never commit secrets, raw private data or unrelated user edits. Do not force-push, rewrite history, delete branches or run destructive resets. Leave a nonworking checkpoint only if unavoidable, clearly labeled WIP with exact failing checks; never call it verified.

Do not claim commits happened if Git identity prevented them. Local commit is not remote backup. Detect existing remote/auth, provide a private GitHub setup if needed, and confirm destination before the first push to an existing remote. Never publish the repo publicly by default. Push only to the intended authorized destination, preserving history.

## 9. Agent continuity: make Codex able to resume

Create and maintain:
- `AGENTS.md`: canonical operating instructions, architecture invariants, repo map, commands, secret/data handling, Git/check policy. Keep concise.
- `CLAUDE.md`: explicitly imports/references AGENTS.md using supported Claude project-memory behavior; lists the mandatory start-of-session reads. Do not maintain contradictory duplicated instructions.
- `docs/IMPLEMENTATION_PLAN.md`: this spec distilled into checkboxes and acceptance gates.
- `docs/DECISIONS.md`: short dated decisions and why alternatives were rejected.
- `HANDOFF.md`: current milestone, completed features, exact next tasks, blockers, commands/results, latest verified commit reference, schema/snapshot versions, environment variable names only, deployment status, known defects.
- `README.md`: beginner-readable Windows setup, run/test/extract/export/score/publish commands, service setup, data paths, actual coverage and demo steps.
- `.env.example`: names and descriptions, no values that are credentials.

Update HANDOFF.md in every milestone commit. To avoid a self-referential commit hash, record the prior verified commit or checkpoint label and use `git log` as current truth. Record actual checks, including failures/not-run. At session start read AGENTS.md, HANDOFF.md, decisions, git status and recent log before modifying anything.

At a context reset or handoff, continue the next unfinished acceptance item. Do not redesign the project or re-run all research.

## 10. Deployment and final definition of done

Store law snapshots durably; no reliance on writable serverless disk or an in-memory job queue. Configure server-only keys, public publishable auth key, database policies, source assets and auth callback URLs. Public sample demo must not need login; private saving must.

Check the deployed URL, not just localhost: assets/fonts, routes, date queries, citations, sign-in callback, save/reload, changes and exports. Avoid build-time network fetching of required corpus or fonts. Verify request body/duration limits before any server extraction feature. Never call a task completed if deployment/account access remains blocked: report the exact remaining user action while completing everything possible locally.

Completion requires:
1. Working live site or explicit deployment blocker; no invented URL.
2. Actual automated corpus pipeline and same engine for UI/batch.
3. Accurate unknown/pending/future/conflict handling and evidence.
4. Real account isolation and persistent saved properties/reports.
5. Available official cases run, with full real scoring report; T6 status truthful.
6. Meaningful tests and desktop/mobile browser inspection.
7. Git milestone history, documented setup and current handoff.
8. No visible broken controls, fake metrics or unlabeled synthetic legal data.

Finish with a short table: feature / verified / limitation; actual deployment URL, actual score, test results, latest commit, remaining blockers and exact Windows launch instructions. Do not end with only a plan or an offer to implement.

## Verified references informing this design

Use these when resolving implementation details; do not spend hours rereading papers during the build:
- Next.js server/client boundaries: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Supabase SSR: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Vercel runtime limits: https://vercel.com/docs/functions/limitations
- shadcn sidebar: https://ui.shadcn.com/docs/components/radix/sidebar
- WCAG color independence: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- Claude project memory: https://code.claude.com/docs/en/memory
- STARA, provision completeness: https://reglab.github.io/stara/
- Span-grounded exception trees: https://arxiv.org/abs/2606.08932
- L4L, formal evaluation: https://arxiv.org/abs/2511.21033
- Temporal statutory QA: https://arxiv.org/abs/2605.23497
- De Jure, structured extraction/repair: https://arxiv.org/abs/2604.02276
- LegalBench-RAG, source spans: https://arxiv.org/abs/2408.10343
- Legal mutation testing: https://arxiv.org/abs/2404.09868

These are research-informed engineering choices, not a claim that the system has already been implemented, benchmarked or legally verified. This plan is a ten-hour target conditional on starter availability, credentials and team capability.

BEGIN NOW: inspect the workspace, identify starter/scorer availability, establish Git and handoff, then implement the first vertical slice. Ask only for genuinely missing inputs or access; continue all independent authorized work.

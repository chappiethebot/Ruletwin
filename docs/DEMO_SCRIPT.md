# Live demo and video script (v5)

v5 submission package: `rules.json`, `lookups.json`, `changes.json`, a **live demo** and a **one-page method note** (`docs/METHOD_NOTE.md`). If you record videos, the organizers asked that they show **our own system output and validation**, not `score.py` (it is not shared). There is no hour-16 release; the five change tests T1–T5 are fixed. Use the frozen snapshot shown in the header.

## Live demo (≈5 min)
1. **Landing page:** what the tool answers, coverage numbers, "Legal information, not legal advice".
2. **Address with layered law:** Check address → `3515 FILLMORE ST, San Francisco` (A0016, built 1926), as of 2026-10-01. Jurisdiction stack CA › San Francisco County › San Francisco. "In plain words": the SF Rent Ordinance applies and the AB 1482 state cap yields to it, plus just cause, deposit, fees and algorithmic pricing. Switch to **Ver en español**.
3. **Every answer traceable:** open **Source evidence** (exact quoted span, URL, retrieval date, snapshot). Show the confidence badge, then open the **Audit view** (source, retrieval date, as-of date, reasoning boundary for every answer) and download its JSON.
4. **Missing facts handled honestly:** `1609 ADDISON ST, Berkeley` (A0005, no year built). A conditional rule shows the outcome per certificate-of-occupancy date and one decisive question. Answer it: the "Hypothetical" banner appears and results update; the audit view still shows official facts only. Reset.
5. **Change cases (Changes page):** T1 (CA, 250 addresses not yet effective → applies), T2 (90 Hoboken/Jersey City addresses, none in Newark), T3 (140 NJ addresses, 90 conflict flags with the local bans), T4 (S.2983 and H.5222 pending, hypothetical impact on 110 MA addresses), T5 (struck ballot question: no rent cap, empty set). Then a custom two-date comparison.
6. **Honesty about sources:** a Hoboken rule card shows "Supplied citation unverified"; open the drawer/audit to see S037 and its reason. This is a research capture with no citation credit. A supplied rule's audit shows its verified headline support and text hash. Neither proves every compiled field.

## Validation to show (instead of a score)
- Re-run `npm test` and `npm run e2e` for the frozen final release. The isolated v5 repair passed 55/55 and 16/16 at 1440 px and 390 px; see `docs/V5_CHALLENGE_REVIEW.md`. Do not display those totals as a fresh main/deployed-release run until repeated there.
- `npm run publish` → fail-closed gates (official schema, exact quote at recorded offsets, unique ids, evidence re-validation), then the T1–T5 counts above.
- `submission/audit_log.json`: input hashes (v5 pack), extraction ledger (89 entries, 0 errors), output hashes, rerun commands.
- `docs/EVALUATION.md`: 37 AI-reviewed reference cases (31/33 definite answers correct, misses explained). Say clearly that it is our own check, not an official score.

## Recorded videos
See `docs/VIDEO_PROMPTS.md`: ElevenLabs voice/music prompts; `node scripts/demo-video.ts` records both 1080p videos from the real site.

## Optional: automated extraction live
`node scripts/ingest.ts --file <ordinance.txt> --jurisdiction "City, ST"`: the extractor reads a new text unaided, validates quotes, publishes, and the new case appears under Changes (not in the official `changes.json`).

## Do not claim
An official score, 100% legal accuracy, or that link-only texts are corpus citations.

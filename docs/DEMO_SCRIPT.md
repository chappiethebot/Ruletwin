# Video and live-demo script

The brief asks for three short videos (team, demo, technical) that include scores, T1–T6 results and the hour-16 ordinance being processed. Use the frozen snapshot; keep each video around 2–3 minutes.

## 1. Team video (≈1 min)
Who you are, the problem in one sentence ("which rental rules apply at this address today, and what is about to change"), and the one idea that sets RuleTwin apart: **every answer is either proved from cited source text or says exactly which fact would decide it.**

## 2. Demo video (≈3 min)
1. Landing page: coverage numbers, "not legal advice".
2. Check address → **3515 FILLMORE ST, San Francisco** (A0016, built 1926) on 2026-10-01. Show the "In plain words" summary; switch to **Ver en español**. Point out the brief's illustrative pattern: SF Rent Ordinance applies and the AB 1482 cap yields to it, plus just cause, deposit, fees and algorithmic pricing.
3. Open **Source evidence** on the SF rule: exact sentence, URL, retrieval date, snapshot. Show the confidence badge.
4. Berkeley **1609 ADDISON ST** (A0005, no year built): a conditional rule shows the outcome branches by CO date and the precise next action. Answer the CO question; the "Hypothetical" banner appears and results update. Reset.
5. Changes → **T3**: 140 NJ addresses go "not yet effective → applies" with 90 Hoboken/Jersey City conflict flags; **T5**: empty (struck ballot question never becomes law); **T4**: S.2983 and H.5222 matched individually, pending, hypothetical impact on 110 MA addresses.
6. Rule library: filter algorithmic rent-setting; show a penalty and the processing ledger.

## 3. Technical video (≈3 min)
1. Pipeline: `extract` (LLM structured output → exact-quote verification, rejected otherwise) → `enrich` (official public sources: Census, MassGIS, NJGIN, SDMC; no owner data) → `publish` (fail-closed gates, content-addressed snapshot) → one deterministic engine shared by website and exports.
2. Three-valued logic plus constraint reasoning: missing facts that cannot change the answer are proved irrelevant; otherwise exact branches and a single decisive question.
3. Scores: run `python score.py` on the dev set **if the organizers provide it** and show the full report. Otherwise show `npm test` (50/50), `npm run e2e` (16/16), `docs/EVALUATION.md` (labelled as AI-reviewed, not an official score) and the T1–T5 counts.
4. Hour 16: `node scripts/t6.ts --file <ordinance.txt> --test <t6.json>` live; show the extracted rule, its future effective date and the affected addresses. This is also the "automated extraction" rerun check.
5. Scalability: a new jurisdiction = add its texts to a manifest folder and run the same commands; no hand-coded rules (README "Hour-16 ordinance" and `supplementary/manifest.csv` format).

## Do not claim
An official score without `score.py`, 100% legal accuracy, or that T6 passed before running it on the real file.

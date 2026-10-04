# ElevenLabs prompts for the two demo videos

The judges asked that videos show **our own system output**. So the picture always comes from the real website, recorded by `scripts/demo-video.ts`. ElevenLabs supplies the **voice** and the **music**. Do not use generated footage of the product: it would show an interface that does not exist.

Workflow:
1. Make the voice clips and the music below in the ElevenLabs app. Save them under the exact file names given.
2. Start the site in hosted mode (`$env:HOSTED_DEMO="1"; npm run start -- -p 3001`).
3. Run `node scripts/demo-video.ts`. The output is `media/ruletwin-product.mp4` and `media/ruletwin-technical.mp4`: 1080p, under 60 s, with cross-fades, title and end cards, captions and music ducked under the voice.

With `ELEVENLABS_API_KEY` in `.env.local`, step 1 for the voice happens automatically. Files in `media/voice/` always take priority over the API.

## 1. Voice

**Voice choice (Voice Library search or Voice Design prompt):**

> A warm, confident, articulate narrator for a professional software product demo. Mid-30s, neutral American accent, clear diction, calm and trustworthy, like a legal-tech or fintech launch video. Natural pacing, slight smile in the voice, never salesy or over-excited. Studio-quality, dry recording with no reverb.

**Settings (Text to Speech):** model *Eleven Multilingual v2*, stability ≈ 55 %, similarity ≈ 80 %, style ≈ 15 %, speaker boost on. Generate each line separately and download it as MP3.

Paste each line exactly; the spelled-out numbers are deliberate.

### Product demo: save as `media/voice/product-N.mp3`

| File | Line |
|---|---|
| product-1.mp3 | Rental housing law comes in layers: state, county and city. RuleTwin answers one question for any building: which rules apply here, today? |
| product-2.mp3 | Search an address, like thirty-five fifteen Fillmore Street in San Francisco. |
| product-3.mp3 | You get a plain-language answer: the city's rent ordinance applies, and the state cap yields to it. In English, or in Spanish. |
| product-4.mp3 | Every answer is traced to the exact sentence of law, with its source and retrieval date. |
| product-5.mp3 | When the data can't decide, RuleTwin says unknown, and asks the one question that would settle it. |
| product-6.mp3 | It also tracks law changes. New Jersey's FAIR Act affects one hundred forty buildings, and ninety are flagged for conflict with local bans. |
| product-7.mp3 | RuleTwin. Housing law, made visible, one address at a time. |

### Technical walkthrough: save as `media/voice/technical-N.mp3`

| File | Line |
|---|---|
| technical-1.mp3 | Module A. A language model reads every supplied document and outputs structured rules. Each quote must match the source exactly, or the record is rejected. Forty-eight rules, zero errors. |
| technical-2.mp3 | Each rule follows the official schema, with its coverage conditions compiled into testable logic. |
| technical-3.mp3 | Module B. The Census geocoder finds the legal city. One deterministic engine applies every rule with true, false and unknown logic, and proves which missing facts matter. |
| technical-4.mp3 | Every answer carries its source, retrieval date, as-of date and reasoning boundary. |
| technical-5.mp3 | Module C replays all five supplied change cases through the same engine. Massachusetts' bills stay pending, with a hypothetical impact on one hundred ten buildings. |
| technical-6.mp3 | Fifty-six unit tests, sixteen browser journeys, and a reproducible audit log. Legal information, not legal advice. |

Numbering starts at 1 because scene 0 is the title card. `node scripts/demo-video.ts --lines` prints this list from the script, so it never drifts.

## 2. Music (ElevenLabs Music): save as `media/music/product.mp3` and `media/music/technical.mp3`

**Product demo:**

> 60-second instrumental background track for a modern, minimal software product demo. Clean and optimistic: soft felt piano, warm analog synth pads, light pulsing plucks and subtle brushed percussion. 100 BPM, major key, steady and uplifting, with no build-ups or drops and no vocals. Leave space for a voiceover. Gentle fade-in, resolving ending. Apple keynote / Stripe launch-video feel.

**Technical walkthrough:**

> 60-second instrumental background track for a technical software walkthrough. Focused and precise: minimal electronic pulses, soft arpeggiated synth, muted kick, airy pads, a sense of quiet momentum. 95 BPM, no vocals, no dramatic drops, mixed low and unobtrusive under a voiceover. Smooth fade-out ending.

One file named `media/music/bed.mp3` is used for both videos if the per-video files are missing. The script ducks the music automatically while the voice speaks.

## 3. Optional: an ElevenLabs-generated opener

If your plan includes video generation, use it only for an abstract 3–4 s opener, never for product screens. Add it in front of the title card in any editor.

> Slow cinematic aerial drift over a city block of apartment buildings at golden hour. Thin glowing orange lines trace individual building outlines one by one, like an address being located on a map. Clean, minimal, white-and-warm palette, shallow depth of field, no text, no people, no logos. 4 seconds, smooth camera motion, 16:9.

## Rules we keep (judging criteria)

- Footage shows the real system and its real numbers: 48 rules, 500 addresses, T1–T5.
- Say "Legal information, not legal advice." It is in the technical voiceover and on both end cards.
- No official score is claimed: the organizers did not share `score.py`.

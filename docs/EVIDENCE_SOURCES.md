# Evidence sources: access methods, terms, and what each can prove

All sources were inspected on 2026-10-04 before use. Adapters live in `scripts/evidence/adapters.ts`; validation in `src/lib/engine/evidence.ts`.
Rules that apply to every source:
- No owner names or owner mailing addresses are requested. The challenge excluded them deliberately.
- A search that finds nothing is recorded as `inconclusive` and never changes a result.
- A record valid only from its retrieval date (a current status) is not applied to earlier as-of dates.

| Source | Access method (documented) | Terms / license | Proves | Cannot prove |
|---|---|---|---|---|
| US Census Geocoder | REST `geocoding.geo.census.gov/geocoder/geographies/address` | Public, no key | Incorporated place for a matched address | Anything for unmatched addresses (no house number, unknown formats) |
| Census 2020 ZCTA↔place relationship file | Static file `www2.census.gov/.../tab20_zcta520_place20_natl.txt` | Public | Admissible municipalities for a ZIP; a single place only when 100% of the ZCTA land area lies in it | ZIP ≠ ZCTA exactly; useless when the assessor ZIP is an owner mailing ZIP (state check rejects those) |
| MassGIS Master Address Data (NG911 Address Finder hosted layer) | ArcGIS FeatureServer `query` | Public MassGIS service | That a street exists within a ZIP (used to corroborate the ZIP) | Legal municipality: its `COMMUNITY` field is the neighbourhood (e.g. DORCHESTER), so it is not used as proof of city. The "Massachusetts_9-1-1_Address_Points" layer returned 0 rows publicly and is not used |
| NJGIN `NJ_Geocode` GeocodeServer | ArcGIS `findAddressCandidates` | NJOGIS public service | Point location of a NJ point address (PointAddress, score ≥ 95) | The `City` attribute may be postal, so it is not used as proof |
| NJ municipal boundaries (`NJ_Municipalities_3857`) | ArcGIS FeatureServer point-in-polygon `query` | NJOGIS public service | Legal municipality containing the geocoded point | — |
| NJ MOD-IV composite parcels | ArcGIS FeatureServer `query`, outFields restricted (no `OWNER_NAME`, `ST_ADDRESS`, `CITY_STATE`) | NJOGIS public service | Year built when `YR_CONSTR` is populated | Measured: 106/106 sample parcels found, `YR_CONSTR` empty in all 106 → inconclusive |
| LADBS Certificates of Occupancy (`data.lacity.org` 3f9m-afei) | Socrata SODA API | CC0 public domain | First CO date when a **new-building** CO record exists | Records start in 2005; addition/alteration COs are not the first CO; no record ≠ no CO |
| San Diego Municipal Code PDFs (`docs.sandiego.gov/municode`) | Official PDF per division | Official city code | Adoption and effective date from codified history notes (e.g. "added 5-22-2025 by O-21955 N.S.; effective 6-21-2025.") | — |
| LA RSO status (ZIMAS, linked from LAHD "RSO Property Search") | Interactive web app only; no documented public API | City web application | **Not automated** (would require reverse-engineering an undocumented API). Verified-record import only. LAHD notes the status is property-level ("at least one unit") and "may change", so a record is valid from its retrieval date and says nothing about a specific unit | Unit-level status; historical status |

## Verified record import

When a source can't be automated (ZIMAS, a signed ordinance PDF that isn't online, a building-department letter), a reviewer adds records to `data/evidence/verified/<name>.json`: a JSON array of partial EvidenceRecords. Each needs:
- `subject` (property id or rule id), `field`, `value`;
- `valid.from` (normally the date the reviewer looked it up);
- `source.url`, `source.retrieved_at`, `source.span` (exact text as shown on the source);
- `source.record_id` or a `reasons` entry containing `reviewer: <name>`.

Records without a reviewer are rejected. See `data/evidence/verified/TEMPLATE.json.example` (not loaded).

Then run `node scripts/enrich.ts` and `npm run publish`.

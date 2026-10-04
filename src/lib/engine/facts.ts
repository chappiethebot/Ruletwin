// Turn assessor rows into typed facts. Never infers owner facts; unit ranges come
// only from the supplied use code/description, and are labelled as such.
import type { Facts, Fact } from "./types.ts";

// RFC-4180-ish CSV parser (quoted fields, embedded commas/quotes/newlines).
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((c) => c !== ""));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.replace(/^﻿/, ""), r[i] ?? ""])));
}

// Unit-count interval from a use description, or null. Exported for tests.
export function unitsFromUse(useCode: string, desc: string, state: string): [number, number, string] | null {
  const d = desc.toUpperCase();
  let m: RegExpExecArray | null;
  if ((m = /(\d+)\s*-\s*(\d+)[- ]UNIT/.exec(d))) return [+m[1], +m[2], `use description "${desc}"`];
  if ((m = />\s*(\d+)[- ]UNIT/.exec(d))) return [+m[1] + 1, Infinity, `use description "${desc}"`];
  if ((m = /(\d+)\s+TO\s+(\d+)\s+UNITS/.exec(d))) return [+m[1], +m[2], `use description "${desc}"`];
  if ((m = /(\d+)\s+UNITS OR MORE|(\d+)\+\s*UNITS/.exec(d))) return [+(m[1] ?? m[2]), Infinity, `use description "${desc}"`];
  if (/FIVE OR MORE/.test(d)) return [5, Infinity, `use description "${desc}"`];
  if ((m = /(\d+)\s+UNITS OR LESS/.exec(d))) return [2, +m[1], `use description "${desc}"`];
  // Local MOD-IV shorthand ("6B-20U-G"): not a documented structured count, so it is a disclosed presumption.
  if (state === "NJ" && (m = /(?:^|[-\s.])(\d+)U(?:$|[-\s.])/.exec(d))) return [+m[1], +m[1], `unverified NJ MOD-IV building-description shorthand "${desc}"`];
  // NJ MOD-IV property class 4C = apartment building of five or more units (class 2 covers 1-4).
  if (state === "NJ" && useCode.toUpperCase() === "4C") return [5, Infinity, "NJ MOD-IV property class 4C (apartments, 5+ units)"];
  return null;
}

const missing = (source: string, note: string): Fact => ({ state: "missing", source, note });

// Year built is not a certificate-of-occupancy date. Without a CO record the first CO
// is presumed within the year built (participant guide §4.1: "Year built ≠ certificate
// of occupancy ... A building in the cutoff year should be 'unknown'"), so a cutoff
// falling inside that year stays unknown. Disclosed wherever it decides a result; a
// real CO record replaces it. Raise CO_LAG_YEARS for a more conservative policy.
export const CO_LAG_YEARS = 0;
export const coBound = (yb: number): [string, string] => [`${yb}-01-01`, `${yb + CO_LAG_YEARS}-12-31`];

export function factsFromRow(r: Record<string, string>): Facts {
  const src = r.source_dataset || "sample_addresses.csv";
  const facts: Facts = {};

  // Numeric contract: plain digits only (no "2e1", sentinels or whitespace tricks); a
  // year must not be later than the record's own capture year. Raw strings stay in `raw`.
  const captureYear = Number(/^(\d{4})/.exec(r.retrieved_at ?? "")?.[1] ?? new Date().getFullYear());
  const ybRaw = (r.year_built ?? "").trim();
  const yb = /^\d{4}$/.test(ybRaw) ? Number(ybRaw) : NaN;
  if (yb >= 1700 && yb <= captureYear) {
    facts.year_built = { state: "known", lo: yb, hi: yb, source: src };
    // A bound, not an observation: presumed, so every result it decides discloses it.
    const [lo, hi] = coBound(yb);
    facts.co_date = { state: "presumed", lo, hi, source: src,
      note: `bounded from year built ${yb} (assumes first CO within ${CO_LAG_YEARS} year of construction); no CO record` };
  } else {
    facts.year_built = missing(src, ybRaw ? `year built "${ybRaw}" rejected (not a 4-digit year in 1700–${captureYear})` : "no year built in assessor record");
    facts.co_date = missing(src, "no year built or certificate-of-occupancy date in data");
  }

  const uRaw = (r.units ?? "").trim();
  const u = /^\d+$/.test(uRaw) ? Number(uRaw) : NaN;
  if (u > 0) facts.units = { state: "known", lo: u, hi: u, source: src };
  else {
    const range = unitsFromUse(r.use_code ?? "", r.use_description ?? "", r.state);
    facts.units = range
      ? { state: range[2].startsWith("unverified") ? "presumed" : "known", lo: range[0], hi: range[1], source: src, note: `range from ${range[2]}` }
      : missing(src, uRaw ? `units "${uRaw}" rejected (not a positive integer)` : "no unit count in assessor record");
  }

  // Every sample row is a multifamily assessor use code (README §4.1).
  const lo = facts.units.lo;
  facts.property_type = typeof lo === "number" && lo < 2
    ? missing(src, "unit count below 2")
    : { state: "known", cat: "multifamily", source: src, note: `use code ${r.use_code} ${r.use_description}`.trim() };

  facts.owner_type = missing(src, "owner names deliberately excluded from sample");
  facts.owner_occupied = missing(src, "owner occupancy not in data");
  facts.owner_portfolio_units = missing(src, "owner portfolio not in data");

  // Subsidy status is in some use descriptions; otherwise a disclosed presumption.
  facts.affordable_restricted = /SUBSD|SUBSID|S-8|SECTION 8/i.test(r.use_description ?? "")
    ? { state: "known", cat: "true", source: src, note: `use description "${r.use_description}"` }
    : { state: "presumed", cat: "false", source: src, note: "no subsidy/deed restriction recorded in assessor use code" };
  return facts;
}

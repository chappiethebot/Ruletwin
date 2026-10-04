// Shared contracts for extraction, evaluation and export.
// Engine files use relative imports with .ts extensions so the same code runs
// under Next.js and directly under `node` (native type stripping) for the CLI.

export type Truth = "true" | "false" | "unknown";

export const CATEGORIES = [
  "rent_increase_limits",
  "just_cause_eviction",
  "security_deposits",
  "application_screening_fees",
  "screening_restrictions",
  "algorithmic_rent_setting",
] as const;
export type Category = (typeof CATEGORIES)[number];

// Allowlisted property fields a coverage condition may test. Anything else is
// "other" and always evaluates to unknown (never silently dropped).
export const FIELDS = [
  "year_built",
  "units",
  "co_date", // certificate-of-occupancy date; only ever a year-precision proxy here
  "property_type", // multifamily | single_family | condominium | duplex | mobile_home | hotel | dormitory | hospital
  "owner_type", // natural_person | corporation | reit | government | nonprofit
  "owner_occupied",
  "owner_portfolio_units",
  "affordable_restricted", // deed/regulatory-restricted affordable or government-subsidized housing
  "other",
] as const;
export type Field = (typeof FIELDS)[number];

export const OPS = ["lt", "le", "gt", "ge", "eq", "ne", "in"] as const;
export type Op = (typeof OPS)[number];

export interface Atom {
  field: Field;
  op: Op;
  // number "5", date "1979-06-13", relative date "AS_OF-15Y", category "single_family",
  // boolean "true", list "a|b" for `in`.
  value: string;
  negate: boolean;
  description: string; // plain-language reading of the condition
  quote: string; // exact source text supporting this condition
}

export interface Exemption {
  label: string;
  all: Atom[]; // exemption holds when ALL atoms are true
  quote: string;
  // Exemption rests only on facts no dataset field captures (e.g. "tenant shares a
  // kitchen with the owner"). Evaluated as not applying, and always disclosed.
  presumed_inapplicable?: boolean;
}

export interface RuleLogic {
  status_kind: "enacted" | "pending" | "failed";
  conditions: { any: Atom[] }[]; // CNF: every group must hold; a group holds when ANY atom holds
  exemptions: Exemption[];
  // Other effective dates asserted by merged sources (disputed legal version).
  disputed_effective_dates?: string[];
  yields_to_local: boolean; // state rule yields where a same-category local rule covers the unit
  conflict_with_local: boolean; // possible preemption/conflict with same-category local rules
}

export interface SourceRef {
  doc_id: string;
  url: string;
  retrieved_at: string | null;
  source_type: string;
  start: number; // char offsets of quoted_span in the original document text
  end: number;
}

// Official submission fields (schema/rule_record.schema.json) + internal logic.
export interface Rule {
  team_rule_id: string;
  jurisdiction: string; // "CA" or "San Francisco, CA"
  level: "state" | "city";
  category: Category;
  status: "in_force" | "not_yet_effective" | "pending" | "failed";
  title: string;
  requirement: string;
  key_value: string | null;
  // Module A asks for penalties; the supplied schema has no field, so this is an
  // extension property (the schema does not forbid additional properties).
  penalty?: string | null;
  requirement_es?: string; // internal: Spanish plain-language view (not exported)
  coverage_conditions: string | null;
  exemptions: string | null;
  overrides: string[];
  interaction: string | null;
  effective_date: string | null;
  citation: string;
  source_doc_id: string | null;
  source_url: string;
  quoted_span: string;
  confidence: number | null;
  conflict_flag: boolean;
  conflict_note: string | null;
  logic: RuleLogic;
  source: SourceRef;
  extraction: { model: string; prompt_version: string; chunk_hash: string; review: string[] };
}

// A fact is an interval for ordered values (numbers / ISO dates), or a category.
// "presumed" = not in the data, but a disclosed default for rare statuses.
export interface Fact {
  state: "known" | "missing" | "presumed";
  lo?: number | string;
  hi?: number | string;
  cat?: string;
  source: string;
  note?: string;
}
export type Facts = Partial<Record<Field, Fact>>;

export interface Property {
  address_id: string;
  street_address: string;
  postal_city: string;
  state: string;
  zip: string;
  raw: Record<string, string>;
  city: string | null; // legal city, resolved by geocoder; null = unresolved
  city_evidence: string;
  // Admissible legal municipalities when the address is ambiguous (evidence-backed).
  city_candidates?: string[];
  county?: string | null; // Census county for the validated geocode (jurisdiction stack: state › county › city)
  facts: Facts;
}

export type Result =
  | "applies"
  | "unknown"
  | "superseded"
  | "not_yet_effective"
  | "pending"
  | "not_applicable";

export interface AtomTrace {
  atom: Atom;
  truth: Truth;
  fact: string; // human-readable fact used
  presumed: boolean;
}

export interface Evaluation {
  rule_id: string;
  result: Result;
  jurisdiction: Truth;
  coverage: Truth;
  temporal: "in_force" | "not_yet_effective" | "pending" | "failed" | "date_ambiguous";
  conditions: { truth: Truth; atoms: AtomTrace[] }[];
  exemptions: { label: string; truth: Truth; atoms: AtomTrace[]; presumed?: boolean }[];
  missing_facts: Field[];
  presumptions: string[];
  superseded_by: string[];
  conflict_with: string[];
  conflict_flag: boolean;
  explanation: string;
}

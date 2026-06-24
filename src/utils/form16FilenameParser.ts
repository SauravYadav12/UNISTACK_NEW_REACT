import { parseFYStart } from './fiscalYearUtil';

/**
 * Filename → structured fields + tiered employee matcher.
 *
 * TRACES + most Indian payroll systems name Form-16 PDFs with the
 * shape:
 *
 *   NAME_PAN_FYYYYYYY_16_TAG.pdf
 *
 * e.g. `ADITI SHRIVASTAVA_NTAPS3330D_FY202425_16_UNSIGNED.pdf`
 *
 * We extract name + PAN + FY then run a tiered match against the
 * employee lookup list (PAN exact → employeeId substring → name
 * exact → name fuzzy). Tier 1 alone resolves 95%+ of TRACES exports
 * since every Form-16 carries the PAN in its filename per TRACES
 * convention.
 */

export interface ParsedForm16Filename {
  /** Leading name fragment, uppercased + whitespace-collapsed. */
  employeeName?: string;
  /** PAN if the filename contained the standard `AAAAA9999A` shape. */
  pan?: string;
  /** Canonical FY start year (e.g. 2024). */
  fiscalYearStart?: number;
  /** True when the trailing tag is the literal "UNSIGNED". */
  isUnsigned?: boolean;
  /** Original filename (no extension), for debug surfaces. */
  raw: string;
}

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const EMPLOYEE_ID_RE = /UNI-\d{4}-\d{3}/i;

function stripExtension(name: string): string {
  return name.replace(/\.[A-Za-z0-9]+$/, '');
}

/**
 * Parse a single filename. Tolerant of underscores, spaces, dashes
 * between segments — these are normalised to a single `_` before
 * tokenising.
 */
export function parseForm16Filename(filename: string): ParsedForm16Filename {
  const stem = stripExtension(filename).trim();
  const raw = stem;
  if (!stem) return { raw };

  // Allow either underscore or " - " between fields. Keep spaces
  // inside the name token by NOT splitting on space here.
  const normalised = stem.replace(/\s*[-_]\s*/g, '_').replace(/_+/g, '_');
  const tokens = normalised
    .split('_')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  let pan: string | undefined;
  let fiscalYearStart: number | undefined;
  let isUnsigned: boolean | undefined;
  const nonStructuralTokens: string[] = [];

  for (const token of tokens) {
    const upper = token.toUpperCase();
    if (!pan && PAN_RE.test(upper)) {
      pan = upper;
      continue;
    }
    if (fiscalYearStart === undefined) {
      const fy = parseFYStart(token);
      if (Number.isFinite(fy)) {
        fiscalYearStart = fy;
        continue;
      }
    }
    if (upper === 'UNSIGNED') {
      isUnsigned = true;
      continue;
    }
    // The literal "16" marker is a no-op for matching; skip it so
    // the name extractor below doesn't mistake it for part of the name.
    if (upper === '16' || upper === 'FORM16' || upper === 'FORM-16') {
      continue;
    }
    nonStructuralTokens.push(token);
  }

  // Name = whatever leading tokens are left after pulling out the
  // structural fields. If multiple, join with space.
  const employeeName = nonStructuralTokens
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  return {
    employeeName: employeeName || undefined,
    pan,
    fiscalYearStart,
    isUnsigned,
    raw,
  };
}

// ─── Tiered employee matching ──────────────────────────────────────

export interface Form16LookupEmployee {
  userId: string;
  name: string;
  email: string;
  employeeId?: string;
  panNumber?: string;
  designation?: string;
}

export type Form16MatchTier = 'pan' | 'employeeId' | 'name-exact' | 'name-fuzzy' | 'none';

export interface Form16Match {
  employee?: Form16LookupEmployee;
  tier: Form16MatchTier;
  /** 0–1 fuzzy similarity score. Only meaningful for `name-fuzzy`. */
  score?: number;
  /** Set when several employees scored equally — admin must disambiguate. */
  ambiguous?: boolean;
}

const STOPWORDS = new Set([
  'MR', 'MRS', 'MS', 'DR', 'SHRI', 'SMT',
]);

function nameTokens(s: string | undefined | null): string[] {
  if (!s) return [];
  return s
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

/**
 * Jaccard similarity over token sets — cheap, order-independent, and
 * tolerant of repeated tokens. Returns 0..1.
 */
function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersect = 0;
  for (const t of setA) if (setB.has(t)) intersect++;
  const union = setA.size + setB.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

/**
 * Try each match tier in order, most precise first. Returns the
 * highest-confidence match found. Caller renders a chip whose colour
 * is determined by `tier`.
 */
export function matchEmployee(
  parsed: ParsedForm16Filename,
  employees: Form16LookupEmployee[],
): Form16Match {
  // ── Tier 1: PAN exact match (case-insensitive) ──
  if (parsed.pan) {
    const panUpper = parsed.pan.toUpperCase();
    const matches = employees.filter(
      (e) => (e.panNumber || '').toUpperCase() === panUpper,
    );
    if (matches.length === 1) {
      return { employee: matches[0], tier: 'pan' };
    }
    if (matches.length > 1) {
      // Two people sharing a PAN should be impossible in practice,
      // but if it happens (data corruption) flag ambiguous and let
      // the admin pick.
      return { tier: 'pan', ambiguous: true };
    }
  }

  // ── Tier 2: employeeId substring (e.g. UNI-0624-053) ──
  const idMatch = parsed.raw.match(EMPLOYEE_ID_RE);
  if (idMatch) {
    const idUpper = idMatch[0].toUpperCase();
    const match = employees.find(
      (e) => (e.employeeId || '').toUpperCase() === idUpper,
    );
    if (match) {
      return { employee: match, tier: 'employeeId' };
    }
  }

  // ── Tier 3: Exact name match ──
  if (parsed.employeeName) {
    const parsedNorm = parsed.employeeName.replace(/\s+/g, ' ').trim();
    const exact = employees.filter(
      (e) => e.name.toUpperCase().replace(/\s+/g, ' ').trim() === parsedNorm,
    );
    if (exact.length === 1) return { employee: exact[0], tier: 'name-exact' };
    if (exact.length > 1) return { tier: 'name-exact', ambiguous: true };
  }

  // ── Tier 4: Fuzzy name match (Jaccard) ──
  if (parsed.employeeName) {
    const parsedTokens = nameTokens(parsed.employeeName);
    if (parsedTokens.length > 0) {
      let best: { employee: Form16LookupEmployee; score: number } | null = null;
      let tieAtBest = false;
      for (const e of employees) {
        const empTokens = nameTokens(e.name);
        const score = jaccard(parsedTokens, empTokens);
        if (!best) {
          if (score >= 0.75) best = { employee: e, score };
        } else if (score > best.score) {
          best = { employee: e, score };
          tieAtBest = false;
        } else if (score === best.score && score >= 0.75) {
          tieAtBest = true;
        }
      }
      if (best) {
        if (tieAtBest) return { tier: 'name-fuzzy', ambiguous: true, score: best.score };
        return { employee: best.employee, tier: 'name-fuzzy', score: best.score };
      }
    }
  }

  return { tier: 'none' };
}

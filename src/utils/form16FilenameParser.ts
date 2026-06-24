import { parseFYStart } from './fiscalYearUtil';

/**
 * Filename → structured fields + tiered employee matcher.
 *
 * Form-16 filenames from TRACES and most payroll exports embed the
 * PAN, the financial year, and the employee name — but they use a
 * grab-bag of separators (`_`, `-`, `.`, plain space). Earlier this
 * parser tokenised on `_`/`-` only, which silently dropped the PAN
 * for files like
 *
 *   `Aditi.Shrivastava.NTAPS3330D.FY2024-25.16.pdf`
 *   `Form 16 - NTAPS3330D - FY24-25 - Aditi.pdf`
 *
 * The fix is to SEARCH for the structural fields anywhere in the
 * filename via global regex. PAN has a uniquely-shaped 10-character
 * pattern (`AAAAA9999A`) that never collides with English words, so a
 * substring scan is safe. Same for the FY block. Whatever's left
 * after the structural tokens are removed becomes the name fragment
 * the fuzzy matcher reads.
 */

export interface ParsedForm16Filename {
  /** Leading name fragment, uppercased + whitespace-collapsed. */
  employeeName?: string;
  /** PAN if the filename contained the standard `AAAAA9999A` shape. */
  pan?: string;
  /** Canonical FY start year (e.g. 2024). */
  fiscalYearStart?: number;
  /** True when the filename carried the literal "UNSIGNED" tag. */
  isUnsigned?: boolean;
  /** Original filename (no extension), for debug surfaces. */
  raw: string;
}

const PAN_GLOBAL_RE = /[A-Z]{5}[0-9]{4}[A-Z]/;
const FY_GLOBAL_RE = /FY\s*[-_]?\s*(\d{2,4})\s*[-_/]?\s*(\d{2,4})?/i;
const EMPLOYEE_ID_RE = /UNI-\d{4}-\d{3}/i;
const UNSIGNED_RE = /\bUNSIGNED\b/i;

function stripExtension(name: string): string {
  return name.replace(/\.[A-Za-z0-9]+$/, '');
}

/**
 * Normalise raw text to A-Z + space tokens for name extraction. Digits
 * and punctuation become spaces so we keep word boundaries without
 * carrying noise into the matcher.
 */
function normaliseForName(s: string): string {
  return s
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse a single filename. Tolerant of any separator scheme — `_`, `-`,
 * `.`, space, or none — because PAN + FY are pulled out by global
 * regex, not by tokenising on a specific delimiter.
 */
export function parseForm16Filename(filename: string): ParsedForm16Filename {
  const stem = stripExtension(filename).trim();
  const raw = stem;
  if (!stem) return { raw };

  const upper = stem.toUpperCase();

  // ── PAN ─────────────────────────────────────────────────────────
  // Find the FIRST PAN-shaped substring anywhere in the filename.
  // PAN is `AAAAA9999A` — a 10-char pattern that never accidentally
  // matches an English word, so substring search is safe.
  let pan: string | undefined;
  const panMatch = upper.match(PAN_GLOBAL_RE);
  if (panMatch) pan = panMatch[0];

  // ── FY ──────────────────────────────────────────────────────────
  // Match `FY2024-25`, `FY 2024 25`, `FY24-25`, `FY2425`, etc. Also
  // a bare `FY2024` falls through to the parseFYStart helper.
  let fiscalYearStart: number | undefined;
  const fyMatch = stem.match(FY_GLOBAL_RE);
  if (fyMatch) {
    // Pass the matched substring through the canonical parser so
    // the FY-with-end-year shorthand (`FY2024-25`, `FY2425`) is
    // normalised to a start year.
    const fy = parseFYStart(fyMatch[0]);
    if (Number.isFinite(fy)) fiscalYearStart = fy;
  }
  // Fallback: if `FY` prefix wasn't present, try a bare 4-digit
  // year followed by 2-digit end (e.g. `2024-25`) — common when the
  // payroll system strips the `FY` label.
  if (fiscalYearStart === undefined) {
    const bare = stem.match(/\b(\d{4})\s*[-_/]\s*(\d{2})\b/);
    if (bare) {
      const fy = parseFYStart(`${bare[1]}-${bare[2]}`);
      if (Number.isFinite(fy)) fiscalYearStart = fy;
    }
  }

  // ── UNSIGNED tag ───────────────────────────────────────────────
  const isUnsigned = UNSIGNED_RE.test(stem) || undefined;

  // ── Name ────────────────────────────────────────────────────────
  // Strip out everything we've already extracted from a copy of the
  // filename, then normalise what's left. Whatever survives is the
  // candidate's name fragment.
  let nameSource = stem;
  if (pan) nameSource = nameSource.replace(new RegExp(pan, 'gi'), ' ');
  if (fyMatch) nameSource = nameSource.replace(fyMatch[0], ' ');
  // Strip standalone year tokens (e.g. "2024-25", "2425") so they
  // don't bleed into the name.
  nameSource = nameSource
    .replace(/\bFY\d{2,4}[-_/]?\d{0,2}\b/gi, ' ')
    .replace(/\b\d{4}[-_/]\d{2}\b/g, ' ')
    .replace(/\b\d{4}\d{2}\b/g, ' ');
  // Strip the literal "Form 16" / "16" form-type marker.
  nameSource = nameSource
    .replace(/\bFORM[\s_-]*16\b/gi, ' ')
    .replace(/\b16\b/g, ' ');
  // Strip the UNSIGNED / SIGNED tag.
  nameSource = nameSource
    .replace(/\bUN?SIGNED\b/gi, ' ')
    .replace(/\bSIGNED\b/gi, ' ');
  // Strip any employee-id token (we keep it for matching but
  // it shouldn't be part of the name).
  nameSource = nameSource.replace(EMPLOYEE_ID_RE, ' ');

  const employeeName = normaliseForName(nameSource);

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

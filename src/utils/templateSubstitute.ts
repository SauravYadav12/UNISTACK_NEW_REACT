/**
 * Mirror of the server's utils/templateSubstitute.ts. Duplicated verbatim
 * because the two repos aren't in a monorepo — the tests assert the two
 * implementations stay behaviorally identical.
 */

export type SubstitutionVars = Record<string, unknown>;

const TOKEN_RE = /{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g;

export function substitute(template: string, vars: SubstitutionVars): string {
  if (!template) return '';
  return template.replace(TOKEN_RE, (match, key: string) => {
    const v = vars[key];
    if (v === undefined || v === null) return match;
    return String(v);
  });
}

export function listTokens(template: string): string[] {
  if (!template) return [];
  const out = new Set<string>();
  for (const m of template.matchAll(TOKEN_RE)) {
    out.add(m[1]);
  }
  return [...out];
}

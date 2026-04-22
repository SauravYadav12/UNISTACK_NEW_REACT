import { describe, it, expect } from 'vitest';
import { listTokens, substitute } from './templateSubstitute';

describe('client templateSubstitute', () => {
  it('substitutes tokens with whitespace tolerance', () => {
    expect(substitute('{{ name }}', { name: 'Unicodez' })).toBe('Unicodez');
  });
  it('leaves unknown tokens intact', () => {
    expect(substitute('{{a}}-{{b}}', { a: 1 })).toBe('1-{{b}}');
  });
  it('listTokens returns unique names in order', () => {
    expect(listTokens('{{a}} {{b}} {{a}}')).toEqual(['a', 'b']);
  });
});

import { describe, expect, it } from 'vitest';
import { matchCategoryHint } from './category-suggestions';

describe('matchCategoryHint', () => {
  const categories = [
    { key: 'salute', label: 'Salute' },
    { key: 'ristorazione', label: 'Ristorazione' },
  ];

  it('matches category key or label case-insensitively', () => {
    expect(matchCategoryHint('Salute', categories)).toBe('salute');
    expect(matchCategoryHint('RISTORAZIONE', categories)).toBe('ristorazione');
  });

  it('returns undefined when nothing matches', () => {
    expect(matchCategoryHint('unknown', categories)).toBeUndefined();
    expect(matchCategoryHint('', categories)).toBeUndefined();
  });
});

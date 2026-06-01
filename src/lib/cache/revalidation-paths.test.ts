import { describe, it, expect } from 'vitest';
import { ACCOUNT_MUTATION_PATHS } from './revalidation-paths';

describe('ACCOUNT_MUTATION_PATHS', () => {
  it('includes linked routes for cross-entity refresh', () => {
    expect(ACCOUNT_MUTATION_PATHS).toContain('/transactions');
    expect(ACCOUNT_MUTATION_PATHS).toContain('/budgets');
    expect(ACCOUNT_MUTATION_PATHS).toContain('/reports');
  });
});

import { describe, it, expect } from 'vitest';
import { clerkAppearance } from './clerk-appearance';

describe('clerkAppearance', () => {
  it('maps primary color to the Daylight CSS token', () => {
    expect(clerkAppearance.variables?.colorPrimary).toBe('var(--color-primary)');
  });
});

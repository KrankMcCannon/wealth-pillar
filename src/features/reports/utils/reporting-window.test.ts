import { describe, it, expect } from 'vitest';
import { resolveReportsPreset, DEFAULT_REPORTS_PRESET } from './reporting-window';

describe('resolveReportsPreset', () => {
  it('defaults to yearly when preset is missing', () => {
    expect(resolveReportsPreset()).toBe(DEFAULT_REPORTS_PRESET);
    expect(resolveReportsPreset(undefined)).toBe('yearly');
  });

  it('falls back to yearly for invalid preset values', () => {
    expect(resolveReportsPreset('invalid')).toBe('yearly');
  });

  it('preserves valid preset values', () => {
    expect(resolveReportsPreset('monthly')).toBe('monthly');
    expect(resolveReportsPreset('custom')).toBe('custom');
  });
});

import { describe, it, expect } from 'vitest';
import {
  resolveReportsPreset,
  unionReportingWindows,
  DEFAULT_REPORTS_PRESET,
} from './reporting-window';

describe('unionReportingWindows', () => {
  it('uses current when comparison is null', () => {
    const current = { start: new Date('2024-06-01'), end: new Date('2024-06-30') };
    expect(unionReportingWindows(current, null)).toEqual(current);
  });

  it('spans the earlier start and later end', () => {
    const current = { start: new Date('2024-06-01'), end: new Date('2024-06-30') };
    const comparison = { start: new Date('2024-05-01'), end: new Date('2024-05-31') };
    const union = unionReportingWindows(current, comparison);
    expect(union.start).toEqual(comparison.start);
    expect(union.end).toEqual(current.end);
  });
});

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

import { describe, it, expect } from 'vitest';
import {
  formatBenchmarkAxisHead,
  formatHistoryAxisDate,
  formatLocaleMediumDate,
} from './chart-format-utils';

describe('chart-format-utils', () => {
  it('formats history axis date as month/day', () => {
    expect(formatHistoryAxisDate('2024-06-15')).toBe('06/15');
    expect(formatHistoryAxisDate('label')).toBe('label');
  });

  it('formats benchmark axis head as first token', () => {
    expect(formatBenchmarkAxisHead('2024-01-02 00:00:00')).toBe('2024-01-02');
  });

  it('formats locale medium date', () => {
    const formatted = formatLocaleMediumDate('2024-01-15', 'en-US');
    expect(formatted).toMatch(/Jan/);
  });
});

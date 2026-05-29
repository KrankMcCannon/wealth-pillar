import { describe, it, expect } from 'vitest';
import { buildAllocationChartData } from './allocation-chart-data';

describe('buildAllocationChartData', () => {
  it('returns top 4 slices plus others bucket', () => {
    const slices = [
      { symbol: 'A', value: 100 },
      { symbol: 'B', value: 80 },
      { symbol: 'C', value: 60 },
      { symbol: 'D', value: 40 },
      { symbol: 'E', value: 20 },
      { symbol: 'F', value: 10 },
    ];

    const result = buildAllocationChartData(slices, 'Others');

    expect(result).toHaveLength(5);
    expect(result[0]?.name).toBe('A');
    expect(result[4]?.name).toBe('Others');
    expect(result[4]?.value).toBe(30);
  });

  it('uses distinct chart token colors', () => {
    const result = buildAllocationChartData(
      [
        { symbol: 'A', value: 1 },
        { symbol: 'B', value: 1 },
        { symbol: 'C', value: 1 },
        { symbol: 'D', value: 1 },
      ],
      'Others'
    );
    const colors = new Set(result.map((r) => r.color));
    expect(colors.size).toBe(4);
  });

  it('filters zero-value slices', () => {
    const result = buildAllocationChartData(
      [
        { symbol: 'A', value: 0 },
        { symbol: 'B', value: 5 },
      ],
      'Others'
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('B');
  });
});

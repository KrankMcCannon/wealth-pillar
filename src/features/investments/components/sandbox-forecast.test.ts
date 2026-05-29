import { describe, it, expect } from 'vitest';
import { buildForecastSeries, clampAmount, clampRate, clampYears } from './sandbox-forecast-tab';

describe('sandbox forecast clamps', () => {
  it('clamps amount within bounds', () => {
    expect(clampAmount('invalid', 100)).toBe(100);
    expect(clampAmount('-5', 100)).toBe(0);
    expect(clampAmount('2000000000000000', 100)).toBe(1e12);
  });

  it('clamps years within bounds', () => {
    expect(clampYears('0', 10)).toBe(1);
    expect(clampYears('999', 10)).toBe(80);
  });

  it('clamps rate within bounds', () => {
    expect(clampRate('-100', 7)).toBe(-50);
    expect(clampRate('100', 7)).toBe(50);
  });
});

describe('buildForecastSeries', () => {
  it('applies compound growth', () => {
    const data = buildForecastSeries(1000, 2, 10);
    expect(data).toHaveLength(3);
    expect(data[0]?.amount).toBe(1000);
    expect(data[1]?.amount).toBe(1100);
    expect(data[2]?.amount).toBe(1210);
  });
});

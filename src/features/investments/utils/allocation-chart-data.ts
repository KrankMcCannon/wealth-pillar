export interface AllocationChartSlice {
  name: string;
  value: number;
  color: string;
}

const ALLOCATION_CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
] as const;

export function buildAllocationChartData(
  slices: Array<{ symbol: string; value: number }>,
  othersLabel: string
): AllocationChartSlice[] {
  const sortedGroups = slices
    .filter((item) => item.value > 0)
    .map((item) => ({ name: item.symbol, value: item.value }))
    .sort((a, b) => b.value - a.value);

  const top4 = sortedGroups.slice(0, 4);
  const others = sortedGroups.slice(4);
  const othersTotal = others.reduce((sum, item) => sum + item.value, 0);

  const allocationData: AllocationChartSlice[] = top4.map((item, index) => ({
    ...item,
    color: ALLOCATION_CHART_COLORS[index] ?? ALLOCATION_CHART_COLORS[0],
  }));

  if (othersTotal > 0) {
    allocationData.push({
      name: othersLabel,
      value: othersTotal,
      color: ALLOCATION_CHART_COLORS[4],
    });
  }

  return allocationData;
}

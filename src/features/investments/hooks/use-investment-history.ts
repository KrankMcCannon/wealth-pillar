import { useMemo } from 'react';
import type { Investment } from '@/components/investments/personal-investment-tab';

interface UseInvestmentHistoryProps {
  investments: Investment[];
  indexData?: { datetime: string; close: string }[];
  summary: {
    totalCurrentValue: number;
  };
  currentIndex?: string;
}

export function useInvestmentHistory({ investments, indexData, summary, currentIndex }: UseInvestmentHistoryProps) {
  return useMemo(() => {
    if (!indexData || indexData.length === 0) return [];

    // Sort index data ascending by date
    const sortedIndexData = [...indexData].sort((a, b) =>
      new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );

    // 1. Generate Raw History Series
    const rawHistory = sortedIndexData.map(point => {
      const pointDate = new Date(point.datetime);
      let dailyTotalValue = 0;

      const pointPrice = parseFloat(point.close);
      if (isNaN(pointPrice)) return null;

      investments.forEach(inv => {
        const createdDate = inv.created_at ? new Date(inv.created_at) : new Date(0);

        // Ownership check
        if (pointDate >= createdDate) {
          if (inv.symbol === currentIndex) {
            // Dynamic pricing for matching assets
            const shares = Number(inv.shares_acquired || 0);
            dailyTotalValue += shares * pointPrice;
          } else {
            // Static value fallback for non-matching assets (to ensure they are included in Total)
            // Using initialValue (value at creation) ensures the magnitude is correct for history.
            dailyTotalValue += Number(inv.initialValue || 0);
          }
        }
      });

      return {
        date: point.datetime.split('T')[0],
        value: dailyTotalValue
      };
    }).filter((p): p is { date: string; value: number } => p !== null && p.value > 0);

    // 2. Align Endpoint to Summary Card
    if (rawHistory.length === 0) return [];

    const lastPoint = rawHistory[rawHistory.length - 1];
    const targetCurrentValue = summary.totalCurrentValue;

    // Calculate adjustment ratio to force the final point to match the Card
    let adjustmentRatio = 1;
    if (lastPoint.value > 0 && targetCurrentValue > 0) {
      adjustmentRatio = targetCurrentValue / lastPoint.value;
    }

    // Apply adjustment to valid history
    return rawHistory.map(point => ({
      ...point,
      value: point.value * adjustmentRatio
    }));
  }, [investments, indexData, currentIndex, summary.totalCurrentValue]);
}

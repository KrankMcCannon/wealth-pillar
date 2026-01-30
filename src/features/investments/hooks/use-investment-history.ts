import { useMemo } from 'react';
import type { Investment } from '@/components/investments/personal-investment-tab';

type TimeSeriesEntry = { datetime?: string; time?: string; date?: string; close: string | number };

interface UseInvestmentHistoryProps {
  investments: Investment[];
  indexData?: TimeSeriesEntry[];
  summary: {
    totalCurrentValue: number;
  };
  currentIndex?: string;
}

// Helper to get date string from various formats
function getDateString(entry: TimeSeriesEntry): string {
  const raw = entry.datetime ?? entry.time ?? entry.date ?? '';
  return String(raw).split('T')[0].split(' ')[0];
}

export function useInvestmentHistory({ investments, indexData, summary, currentIndex }: UseInvestmentHistoryProps) {
  return useMemo(() => {
    if (!indexData || indexData.length === 0) return [];

    // Sort index data ascending by date
    const sortedIndexData = [...indexData].sort((a, b) =>
      getDateString(a).localeCompare(getDateString(b))
    );

    // 1. Generate Raw History Series
    const rawHistory = sortedIndexData.map(point => {
      const dateStr = getDateString(point);
      const pointDate = new Date(dateStr);
      let dailyTotalValue = 0;

      const pointPrice = Number.parseFloat(String(point.close));
      if (Number.isNaN(pointPrice)) return null;

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
        date: dateStr,
        value: dailyTotalValue
      };
    }).filter((p): p is { date: string; value: number } => p !== null && p.value > 0);

    // 2. Align Endpoint to Summary Card
    if (rawHistory.length === 0) return [];

    const lastPoint = rawHistory.at(-1);
    const targetCurrentValue = summary.totalCurrentValue;

    // Calculate adjustment ratio to force the final point to match the Card
    let adjustmentRatio = 1;
    if (lastPoint?.value && lastPoint.value > 0 && targetCurrentValue > 0) {
      adjustmentRatio = targetCurrentValue / lastPoint.value;
    }

    // Apply adjustment to valid history
    return rawHistory.map(point => ({
      ...point,
      value: point.value * adjustmentRatio
    }));
  }, [investments, indexData, currentIndex, summary.totalCurrentValue]);
}

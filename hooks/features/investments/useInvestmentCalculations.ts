import { useMemo } from 'react';
import { formatCurrency } from '../../../constants';
import { InvestmentHolding } from '../../../types';

interface UsePortfolioSummaryProps {
  holdings: InvestmentHolding[];
}

/**
 * Hook per gestire i calcoli del riepilogo del portafoglio
 * Estrae la business logic dal componente UI
 */
export const usePortfolioSummary = ({ holdings }: UsePortfolioSummaryProps) => {
  const { totalValue, totalCost, totalGainLoss, gainLossPercent } = useMemo(() => {
    const summary = holdings.reduce((acc, h) => {
      acc.totalValue += h.quantity * h.currentPrice;
      acc.totalCost += h.quantity * h.purchasePrice;
      return acc;
    }, { totalValue: 0, totalCost: 0 });

    const totalGainLoss = summary.totalValue - summary.totalCost;
    const gainLossPercent = summary.totalCost > 0 ? (totalGainLoss / summary.totalCost) * 100 : 0;

    return { ...summary, totalGainLoss, gainLossPercent };
  }, [holdings]);

  const isGain = totalGainLoss >= 0;

  const summaryCards = useMemo(() => [
    {
      title: 'Valore Totale Portafoglio',
      value: formatCurrency(totalValue),
      color: 'blue' as 'blue',
    },
    {
      title: 'Guadagno / Perdita Totale',
      value: formatCurrency(totalGainLoss),
      color: (isGain ? 'green' : 'red') as ('green' | 'red'),
    },
    {
      title: 'Rendimento Portafoglio',
      value: `${gainLossPercent.toFixed(2)}%`,
      color: (isGain ? 'green' : 'red') as ('green' | 'red'),
    },
  ], [totalValue, totalGainLoss, gainLossPercent, isGain]);

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    gainLossPercent,
    isGain,
    summaryCards,
  };
};

interface UseInvestmentRowProps {
  holding: InvestmentHolding;
}

/**
 * Hook per gestire i calcoli di una singola riga di investimento
 * Estrae la business logic dal componente UI
 */
export const useInvestmentRow = ({ holding }: UseInvestmentRowProps) => {
  const value = useMemo(() => {
    return holding.quantity * holding.currentPrice;
  }, [holding.quantity, holding.currentPrice]);

  const gainLoss = useMemo(() => {
    return (holding.currentPrice - holding.purchasePrice) * holding.quantity;
  }, [holding.currentPrice, holding.purchasePrice, holding.quantity]);

  const isGain = gainLoss >= 0;

  const gainLossPercent = useMemo(() => {
    return holding.purchasePrice > 0 ? 
      ((holding.currentPrice - holding.purchasePrice) / holding.purchasePrice) * 100 : 0;
  }, [holding.currentPrice, holding.purchasePrice]);

  return {
    value,
    gainLoss,
    isGain,
    gainLossPercent,
  };
};

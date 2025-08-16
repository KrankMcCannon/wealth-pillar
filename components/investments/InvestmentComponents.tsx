import { memo } from 'react';
import { formatCurrency, formatDate } from '../../constants';
import { InvestmentHolding } from '../../types';
import { Card, SummaryCards } from '../ui';
import { usePortfolioSummary, useInvestmentRow } from '../../hooks';
import { ArrowDownIcon, ArrowUpIcon } from '../common';

interface PortfolioSummaryProps {
  holdings: InvestmentHolding[];
}

/**
 * Componente presentazionale per il riepilogo del portafoglio
 */
export const PortfolioSummary = memo<PortfolioSummaryProps>(({ holdings }) => {
  const { summaryCards } = usePortfolioSummary({ holdings });

  return <SummaryCards cards={summaryCards} />;
});

PortfolioSummary.displayName = 'PortfolioSummary';

interface InvestmentRowProps {
  holding: InvestmentHolding;
  personName?: string;
}

/**
 * Componente presentazionale per una riga di investimento
 */
export const InvestmentRow = memo<InvestmentRowProps>(({ holding, personName }) => {
  const { value, gainLoss, isGain, gainLossPercent } = useInvestmentRow({ holding });

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <td className="py-4 px-4">
        <p className="font-bold text-gray-900 dark:text-white">{holding.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{holding.symbol}</p>
        {personName && <p className="text-xs text-blue-400 dark:text-blue-500">{personName}</p>}
      </td>
      <td className="py-4 px-4 text-center">{formatDate(holding.purchaseDate)}</td>
      <td className="py-4 px-4 text-right">{holding.quantity.toLocaleString()}</td>
      <td className="py-4 px-4 text-right font-mono">{formatCurrency(holding.purchasePrice)}</td>
      <td className="py-4 px-4 text-right font-mono">{formatCurrency(holding.currentPrice)}</td>
      <td className="py-4 px-4 text-right font-mono">{formatCurrency(value)}</td>
      <td className={`py-4 px-4 text-right font-mono ${isGain ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        <span className="flex items-center justify-end">
          {isGain ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
          {formatCurrency(gainLoss)}
        </span>
      </td>
    </tr>
  );
});

InvestmentRow.displayName = 'InvestmentRow';

interface InvestmentTableProps {
  holdings: InvestmentHolding[];
  isAllView: boolean;
  getPersonName: (personId: string) => string;
}

/**
 * Componente per la tabella degli investimenti
 */
export const InvestmentTable = memo<InvestmentTableProps>(({ holdings, isAllView, getPersonName }) => (
  <Card className="overflow-x-auto">
    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white p-6 pb-0">Le tue posizioni</h2>
    <table className="w-full text-left">
      <thead className="border-b-2 border-gray-200 dark:border-gray-600">
        <tr>
          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Investimento</th>
          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-center">Data Acquisto</th>
          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Quantità</th>
          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Prezzo Acquisto</th>
          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Prezzo Corrente</th>
          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Valore</th>
          <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Guadagno/Perdita</th>
        </tr>
      </thead>
      <tbody>
        {holdings.map(holding => (
          <InvestmentRow
            key={holding.id}
            holding={holding}
            personName={isAllView ? getPersonName(holding.personId) : undefined}
          />
        ))}
      </tbody>
    </table>
    {holdings.length === 0 && (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Nessun investimento trovato
      </div>
    )}
  </Card>
));

InvestmentTable.displayName = 'InvestmentTable';

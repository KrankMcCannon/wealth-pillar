import React, { memo } from 'react';
import { formatCurrency, formatDate } from '../../constants';
import { InvestmentHolding } from '../../types';
import { Card, SummaryCards } from '../ui';
import { usePortfolioSummary, useInvestmentRow } from '../../hooks';

// Simple arrow icons as SVG components
const ArrowUpIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

interface PortfolioSummaryProps {
  holdings: InvestmentHolding[];
}

/**
 * Componente presentazionale per il riepilogo del portafoglio
 * Tutta la logica di calcolo è delegata al hook usePortfolioSummary
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
 * Tutta la logica di calcolo è delegata al hook useInvestmentRow
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
 * Principio SRP: Single Responsibility - gestisce solo la tabella degli investimenti
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

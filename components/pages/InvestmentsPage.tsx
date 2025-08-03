import React, { useState, useMemo } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { Card } from '../ui/Card';
import { InvestmentHolding } from '../../types';
import { PlusIcon, CalculatorIcon, ArrowUpIcon, ArrowDownIcon } from '../Icons';
import { AddInvestmentModal } from '../AddInvestmentModal';
import { formatCurrency, formatDate } from '../../constants';

const PortfolioSummary: React.FC<{ holdings: InvestmentHolding[] }> = ({ holdings }) => {
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Valore Totale Portafoglio</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">{formatCurrency(totalValue)}</p>
            </Card>
            <Card>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Guadagno / Perdita Totale</h3>
            <p className={`mt-1 text-3xl font-semibold tracking-tight ${isGain ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(totalGainLoss)}</p>
            </Card>
            <Card>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Rendimento Portafoglio</h3>
            <p className={`mt-1 text-3xl font-semibold tracking-tight ${isGain ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{gainLossPercent.toFixed(2)}%</p>
            </Card>
        </div>
    );
};

const InvestmentRow: React.FC<{ holding: InvestmentHolding, personName?: string }> = ({ holding, personName }) => {
    const value = holding.quantity * holding.currentPrice;
    const gainLoss = (holding.currentPrice - holding.purchasePrice) * holding.quantity;
    const isGain = gainLoss >= 0;

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
                  {isGain ? <ArrowUpIcon className="w-4 h-4 mr-1"/> : <ArrowDownIcon className="w-4 h-4 mr-1"/>}
                  {formatCurrency(gainLoss)}
                </span>
            </td>
        </tr>
    );
}

const CompoundInterestCalculator: React.FC = () => {
    const [principal, setPrincipal] = useState(1000);
    const [rate, setRate] = useState(5);
    const [years, setYears] = useState(10);
    const [compoundsPerYear, setCompoundsPerYear] = useState(12);
    const [futureValue, setFutureValue] = useState(0);

    React.useEffect(() => {
        const P = principal;
        const r = rate / 100;
        const n = compoundsPerYear;
        const t = years;
        const A = P * Math.pow((1 + r / n), (n * t));
        setFutureValue(A);
    }, [principal, rate, years, compoundsPerYear]);

    return (
        <Card>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
            <CalculatorIcon className="w-6 h-6 mr-3" />
            Calcolatore Interesse Composto
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
                <label htmlFor="principal" className="text-sm font-medium text-gray-600 dark:text-gray-300">Capitale (€)</label>
                <input type="number" id="principal" value={principal} onChange={e => setPrincipal(Number(e.target.value))} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            <div>
                <label htmlFor="rate" className="text-sm font-medium text-gray-600 dark:text-gray-300">Tasso Annuo (%)</label>
                <input type="number" id="rate" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            </div>
             <div>
                <label htmlFor="years" className="text-sm font-medium text-gray-600 dark:text-gray-300">Anni</label>
                <input type="number" id="years" value={years} onChange={e => setYears(Number(e.target.value))} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            <div>
                <label htmlFor="compounds" className="text-sm font-medium text-gray-600 dark:text-gray-300">Comp. per anno</label>
                <input type="number" id="compounds" value={compoundsPerYear} onChange={e => setCompoundsPerYear(Number(e.target.value))} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-lg text-center">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Valore Futuro</p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(futureValue)}</p>
            </div>
        </Card>
    );
};

export const InvestmentsPage: React.FC = () => {
  const { investments, selectedPersonId, getPersonById } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isAllView = selectedPersonId === 'all';
  
  const displayedHoldings = isAllView
    ? investments
    : investments.filter(inv => inv.personId === selectedPersonId);

  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Investimenti</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">Monitora la performance del tuo portafoglio e dei tuoi asset.</p>
            </div>
            <button
                onClick={() => setIsModalOpen(true)}
                style={{ backgroundColor: 'var(--theme-color)'}}
                className="flex items-center text-white font-bold py-2 px-4 rounded-lg shadow-md hover:opacity-90 transition-opacity"
            >
                <PlusIcon className="w-5 h-5 mr-2" />
                Aggiungi investimento
            </button>
        </div>

        <PortfolioSummary holdings={displayedHoldings} />

        <Card className="overflow-x-auto">
             <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white p-6 pb-0">Le tue posizioni</h2>
            <table className="w-full text-left">
                <thead className="border-b-2 border-gray-200 dark:border-gray-600">
                    <tr>
                        <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Nome</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-center">Data acquisto</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Quantità</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Prezzo acquisto</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Prezzo attuale</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Valore</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Guadagno/Perdita</th>
                    </tr>
                </thead>
                <tbody>
                    {displayedHoldings.length > 0 ? (
                        displayedHoldings.map(h => {
                            const person = isAllView ? getPersonById(h.personId) : undefined;
                            return <InvestmentRow key={h.id} holding={h} personName={person?.name} />
                        })
                    ) : (
                        <tr>
                           <td colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">Nessun investimento da mostrare.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </Card>
        
        <CompoundInterestCalculator />

      </div>
      <AddInvestmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
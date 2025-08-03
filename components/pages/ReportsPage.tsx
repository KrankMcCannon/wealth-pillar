import React, { useMemo, useState } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { Card } from '../ui/Card';
import { TransactionType } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../constants';

const ReportsPage: React.FC = () => {
    const { transactions, selectedPersonId, getAccountById, people, getEffectiveTransactionAmount } = useFinance();

    const isAllView = selectedPersonId === 'all';
    const selectedPerson = !isAllView ? people.find(p => p.id === selectedPersonId) : null;
    
    const availableYears = useMemo(() => {
        const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
        return Array.from(years).sort((a,b) => b - a);
    }, [transactions]);
    
    const [selectedYear, setSelectedYear] = useState(availableYears[0] || new Date().getFullYear());

    const yearlyTransactions = useMemo(() => {
        return (isAllView 
            ? transactions 
            : transactions.filter(t => getAccountById(t.accountId)?.personIds.includes(selectedPersonId))
        ).filter(t => new Date(t.date).getFullYear() === selectedYear)
         .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, selectedPersonId, getAccountById, isAllView, selectedYear]);

    const annualSummary = useMemo(() => {
        return yearlyTransactions
            .filter(tx => tx.category !== 'trasferimento') // Esclude i trasferimenti dai report
            .reduce((acc, tx) => {
                const effectiveAmount = getEffectiveTransactionAmount(tx);
                if (tx.type === TransactionType.ENTRATA) {
                    acc.entrata += effectiveAmount;
                } else {
                    acc.spesa += effectiveAmount;
                }
                return acc;
            }, { entrata: 0, spesa: 0 });
    }, [yearlyTransactions, getEffectiveTransactionAmount]);

    const monthlyData = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => i);
        const data = months.map(monthIndex => {
            const monthName = new Date(0, monthIndex).toLocaleString('it-IT', { month: 'short' });
            const monthTransactions = yearlyTransactions.filter(t => new Date(t.date).getMonth() === monthIndex);
            
            const totals = monthTransactions.reduce((acc, tx) => {
                 const effectiveAmount = getEffectiveTransactionAmount(tx);
                 if (tx.type === TransactionType.ENTRATA) {
                    acc.entrata += effectiveAmount;
                } else {
                    acc.spesa += effectiveAmount;
                }
                return acc;
            }, { entrata: 0, spesa: 0 });

            return {
                name: monthName,
                ...totals
            };
        });
        return data;
    }, [yearlyTransactions, getEffectiveTransactionAmount]);

    const netBalance = annualSummary.entrata - annualSummary.spesa;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                {selectedPerson ? `Report finanziario di ${selectedPerson.name}` : 'Report finanziario generale'}
            </h1>
            <div>
                <label htmlFor="year-select" className="sr-only">Seleziona anno</label>
                <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
            </div>
            </div>
            
            <Card>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Panoramica annuale - {selectedYear}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Entrate totali</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(annualSummary.entrata)}</p>
                </div>
                <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Spese totali</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{formatCurrency(annualSummary.spesa)}</p>
                </div>
                 <div className={`p-4 rounded-lg ${netBalance >= 0 ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-yellow-100 dark:bg-yellow-900/50'}`}>
                <p className={`text-sm font-medium ${netBalance >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-yellow-800 dark:text-yellow-300'}`}>Saldo netto</p>
                <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-yellow-700 dark:text-yellow-400'}`}>{formatCurrency(netBalance)}</p>
                </div>
            </div>
            </Card>

            <Card>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Dettaglio mensile</h2>
            {yearlyTransactions.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                    <Tooltip 
                    contentStyle={{
                        backgroundColor: 'rgba(31, 41, 55, 0.8)',
                        borderColor: '#4b5563',
                        color: '#f3f4f6'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="entrata" fill="#22c55e" name="Entrata" />
                    <Bar dataKey="spesa" fill="#ef4444" name="Spesa" />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-10">Nessuna transazione registrata per il {selectedYear}.</p>
            )}
            </Card>
        </div>
    );
};

export { ReportsPage };
import { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction } from '../../types';
import { useDarkMode, useBreakpoint } from '../../hooks';
import { useExpenseChart } from '../../hooks/features/dashboard/useExpenseChart';
import { Card } from '../ui';
import { formatCurrency } from '../../constants';

/**
 * Props per ExpenseChart
 */
interface ExpenseChartProps {
  transactions: Transaction[];
}

/**
 * Componente ExpenseChart
 */
export const ExpenseChart = memo<ExpenseChartProps>(({ transactions }) => {
  const { expenseData, totalExpenses, hasExpenses, COLORS } = useExpenseChart({ transactions });
  const isDarkMode = useDarkMode();
  const { isMobile } = useBreakpoint();

  if (!hasExpenses) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Ripartizione Spese
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Nessuna spesa registrata
          </h3>
          <p className="text-sm text-center max-w-md">
            Non ci sono spese da visualizzare per il periodo selezionato.
            Aggiungi alcune transazioni per vedere la ripartizione delle spese.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Ripartizione Spese
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">
            {formatCurrency(totalExpenses)} totale
          </span>
        </div>
      </div>

      <div className="w-full">
        <div className="space-y-8">
          {/* Grafico a torta centrato */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <ResponsiveContainer
                width="100%"
                height={isMobile ? 280 : 320}
                className="mx-auto"
              >
                <PieChart>
                  <Pie
                    data={expenseData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 50 : 70}
                    outerRadius={isMobile ? 100 : 130}
                    paddingAngle={3}
                    animationBegin={0}
                    animationDuration={1000}
                    stroke="none"
                  >
                    {expenseData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{
                          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Spesa']}
                    contentStyle={{
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.96)' : 'rgba(31, 41, 55, 0.96)',
                      color: isDarkMode ? '#1f2937' : '#f9fafb',
                      border: isDarkMode ? '1px solid #e5e7eb' : '1px solid #374151',
                      borderRadius: '12px',
                      boxShadow: isDarkMode
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(16px)',
                      fontSize: '14px',
                      padding: '12px 16px',
                      fontWeight: '500'
                    }}
                    labelStyle={{
                      fontWeight: '600',
                      marginBottom: '4px',
                      color: isDarkMode ? '#374151' : '#f3f4f6'
                    }}
                    itemStyle={{
                      color: isDarkMode ? '#6b7280' : '#d1d5db',
                      fontWeight: '500'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lista categorie dettagliata */}
          <div className="grid grid-cols-1 gap-3">
            {expenseData.map((item, index) => {
              const percentage = ((item.value / totalExpenses) * 100);
              return (
                <div
                  key={item.name}
                  className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center mt-1">
                        <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1 mr-1">
                          <div
                            className="h-1 rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.value)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
});

ExpenseChart.displayName = 'ExpenseChart';

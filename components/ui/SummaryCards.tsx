import React, { memo } from 'react';

interface SummaryCardsProps {
  cards: Array<{
    title: string;
    value: string | number;
    subtitle?: string;
    color?: 'green' | 'red' | 'blue' | 'yellow' | 'gray';
    icon?: React.ReactNode;
  }>;
}

/**
 * Componente per visualizzare cards di riepilogo
 */
export const SummaryCards = memo<SummaryCardsProps>(({ cards }) => {
  const getColorClasses = (color: string = 'gray') => {
    const colorMap = {
      green: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
      red: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
      blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
      gray: 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const getValueColorClasses = (color: string = 'gray') => {
    const colorMap = {
      green: 'text-green-700 dark:text-green-400',
      red: 'text-red-700 dark:text-red-400',
      blue: 'text-blue-700 dark:text-blue-400',
      yellow: 'text-yellow-700 dark:text-yellow-400',
      gray: 'text-gray-700 dark:text-gray-400',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div key={index} className={`p-6 rounded-lg ${getColorClasses(card.color)}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">{card.title}</p>
              <p className={`text-2xl font-bold mt-1 ${getValueColorClasses(card.color)}`}>
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-xs mt-1 opacity-75">{card.subtitle}</p>
              )}
            </div>
            {card.icon && (
              <div className="ml-4 opacity-75">
                {card.icon}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

SummaryCards.displayName = 'SummaryCards';

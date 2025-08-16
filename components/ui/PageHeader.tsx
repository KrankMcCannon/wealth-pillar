import React, { memo } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

/**
 * Componente Header per le pagine
 */
export const PageHeader = memo<PageHeaderProps>(({ title, subtitle, children }) => (
  <div className="flex justify-between items-start mb-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
    {children && (
      <div className="flex items-center space-x-4">
        {children}
      </div>
    )}
  </div>
));

PageHeader.displayName = 'PageHeader';

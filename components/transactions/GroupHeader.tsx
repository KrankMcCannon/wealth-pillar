import { memo } from 'react';

interface GroupHeaderProps {
  title: string;
  count?: number;
  variant?: 'simple' | 'rich';
}

/**
 * Shared header for grouped transaction sections (cards/table)
 */
export const GroupHeader = memo<GroupHeaderProps>(({ title, count, variant = 'simple' }) => {
  if (variant === 'rich') {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {typeof count === 'number' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {count} {count === 1 ? 'transazione' : 'transazioni'}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
    </div>
  );
});

GroupHeader.displayName = 'GroupHeader';


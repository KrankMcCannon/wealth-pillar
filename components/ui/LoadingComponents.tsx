import { memo } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'white' | 'gray';
  className?: string;
}

/**
 * Componente Loading Spinner
 */
export const LoadingSpinner = memo<LoadingSpinnerProps>(({ 
  size = 'md', 
  color = 'blue', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
  };

  return (
    <div 
      className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente per stati di loading completi
 */
export const LoadingState = memo<LoadingStateProps>(({ 
  message = 'Caricamento...', 
  size = 'lg' 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <LoadingSpinner size={size} color="blue" className="mx-auto" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  </div>
));

LoadingState.displayName = 'LoadingState';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Componente per stati di errore
 */
export const ErrorState = memo<ErrorStateProps>(({ 
  title = 'Errore', 
  message, 
  onRetry,
  retryLabel = 'Riprova'
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center max-w-md">
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
        <h2 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">
          {title}
        </h2>
        <p className="text-red-600 dark:text-red-300 mb-4">
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  </div>
));

ErrorState.displayName = 'ErrorState';

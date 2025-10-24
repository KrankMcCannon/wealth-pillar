'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, Card } from '../ui';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} reset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component optimized for financial applications
 */
const DefaultErrorFallback: React.FC<{ error?: Error; reset: () => void }> = ({ error, reset }) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center bg-card shadow-lg border border-destructive/20">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-destructive/10 rounded-full">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-2">
          Errore nel caricamento
        </h2>

        <p className="mb-6">
          Si è verificato un errore durante il caricamento dei dati finanziari.
          I tuoi dati sono al sicuro.
        </p>

        {error && process.env.NODE_ENV === 'development' && (
          <div className="bg-muted p-3 rounded-lg mb-4 text-left">
            <p className="text-sm font-mono text-foreground break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Riprova
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Ricarica pagina
          </Button>
        </div>
      </Card>
    </div>
  );
};

/**
 * Financial-specific error fallback for query errors
 */
export const QueryErrorFallback: React.FC<{
  error?: Error | unknown;
  reset: () => void;
  title?: string;
  description?: string;
}> = ({ reset, title, description }) => {
  return (
    <div className="p-4 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-warning/10 rounded-full mb-4">
        <AlertTriangle className="h-6 w-6 text-warning" />
      </div>

      <h3 className="text-lg font-medium text-foreground mb-2">
        {title || 'Errore nei dati'}
      </h3>

      <p className="mb-4 max-w-sm mx-auto">
        {description || 'Non è stato possibile caricare i dati. Verifica la connessione e riprova.'}
      </p>

      <Button
        onClick={reset}
        size="sm"
        variant="outline"
        className="hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Riprova
      </Button>
    </div>
  );
};

/**
 * Loading skeleton optimized for financial data
 */
export const FinancialLoadingSkeleton: React.FC<{
  type?: 'dashboard' | 'transactions' | 'budget' | 'accounts';
}> = ({ type = 'dashboard' }) => {
  const getSkeletonContent = () => {
    switch (type) {
      case 'transactions':
        return (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card p-4 rounded-lg border animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-3 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'budget':
        return (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card p-4 rounded-lg border animate-pulse">
                <div className="flex justify-between items-center mb-3">
                  <div className="h-5 bg-muted rounded w-32"></div>
                  <div className="h-5 bg-muted rounded w-16"></div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-24"></div>
              </div>
            ))}
          </div>
        );

      case 'accounts':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card p-4 rounded-lg border animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 bg-muted rounded w-24"></div>
                  <div className="w-8 h-8 bg-muted rounded"></div>
                </div>
                <div className="h-7 bg-muted rounded w-32"></div>
              </div>
            ))}
          </div>
        );

      default: // dashboard
        return (
          <div className="space-y-6">
            {/* Balance section */}
            <div className="bg-card p-6 rounded-lg shadow-sm animate-pulse">
              <div className="h-6 bg-muted rounded w-32 mb-4"></div>
              <div className="h-8 bg-muted rounded w-48"></div>
            </div>

            {/* Accounts section */}
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded w-24 mb-4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-card p-4 rounded-lg border">
                    <div className="h-5 bg-muted rounded w-24 mb-2"></div>
                    <div className="h-6 bg-muted rounded w-32"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget section */}
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded w-20 mb-4"></div>
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-card p-4 rounded-lg border">
                    <div className="h-5 bg-muted rounded w-28 mb-3"></div>
                    <div className="w-full bg-muted rounded-full h-2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="animate-pulse">
      {getSkeletonContent()}
    </div>
  );
};

export default ErrorBoundaryClass;

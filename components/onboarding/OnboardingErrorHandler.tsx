import { memo } from "react";

interface OnboardingErrorHandlerProps {
  error: string | null;
  onRetry?: () => void;
  onReset?: () => void;
  showRetry?: boolean;
  showReset?: boolean;
  className?: string;
}

/**
 * Componente specializzato per gestire gli errori nell'onboarding
 * Principio SRP: Si occupa solo della visualizzazione degli errori
 * Principio ISP: Interfaccia specifica per la gestione errori onboarding
 */
export const OnboardingErrorHandler = memo<OnboardingErrorHandlerProps>(
  ({ error, onRetry, onReset, showRetry = true, showReset = false, className = "" }) => {
    if (!error) return null;

    const getErrorType = (errorMessage: string) => {
      const lowerError = errorMessage.toLowerCase();

      if (lowerError.includes("rollback")) {
        return {
          type: "rollback",
          title: "Errore durante il salvataggio",
          description: "È stato eseguito un rollback automatico per mantenere la coerenza dei dati.",
          severity: "warning" as const,
        };
      }

      if (lowerError.includes("validazione") || lowerError.includes("validation")) {
        return {
          type: "validation",
          title: "Errore di validazione",
          description: "Alcuni dati inseriti non sono validi. Controlla e riprova.",
          severity: "error" as const,
        };
      }

      if (lowerError.includes("network") || lowerError.includes("connessione")) {
        return {
          type: "network",
          title: "Errore di connessione",
          description: "Problema di rete. Verifica la connessione e riprova.",
          severity: "error" as const,
        };
      }

      if (lowerError.includes("gruppo") || lowerError.includes("group")) {
        return {
          type: "group",
          title: "Errore gruppo",
          description: "Problema con la configurazione del gruppo.",
          severity: "error" as const,
        };
      }

      return {
        type: "generic",
        title: "Errore imprevisto",
        description: "Si è verificato un errore. Riprova o reimposta la configurazione.",
        severity: "error" as const,
      };
    };

    const errorInfo = getErrorType(error);

    const getSeverityClasses = (severity: "error" | "warning") => {
      switch (severity) {
        case "error":
          return {
            container: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
            icon: "text-red-600 dark:text-red-400",
            title: "text-red-800 dark:text-red-200",
            description: "text-red-700 dark:text-red-300",
            message: "text-red-600 dark:text-red-400",
          };
        case "warning":
          return {
            container: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
            icon: "text-orange-600 dark:text-orange-400",
            title: "text-orange-800 dark:text-orange-200",
            description: "text-orange-700 dark:text-orange-300",
            message: "text-orange-600 dark:text-orange-400",
          };
      }
    };

    const classes = getSeverityClasses(errorInfo.severity);

    const getErrorIcon = () => {
      if (errorInfo.type === "rollback") {
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 14.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      }

      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    };

    return (
      <div className={`rounded-lg border p-4 ${classes.container} ${className}`}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${classes.icon}`}>{getErrorIcon()}</div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${classes.title}`}>{errorInfo.title}</h3>
            <div className={`mt-1 text-sm ${classes.description}`}>
              <p>{errorInfo.description}</p>
            </div>
            <div className={`mt-2 text-xs ${classes.message} font-mono bg-white dark:bg-gray-800 p-2 rounded border`}>
              {error}
            </div>

            {/* Azioni disponibili */}
            {(showRetry || showReset) && (
              <div className="mt-4 flex space-x-3">
                {showRetry && onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    Riprova
                  </button>
                )}

                {showReset && onReset && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Reimposta
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

OnboardingErrorHandler.displayName = "OnboardingErrorHandler";

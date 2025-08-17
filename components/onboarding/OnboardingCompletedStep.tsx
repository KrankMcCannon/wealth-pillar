import { memo } from "react";
import { SparklesIcon } from "../common/Icons";
import { OnboardingData } from "../../lib/services/onboarding.service";

interface OnboardingCompletedStepProps {
  onComplete: () => void;
  completedData?: OnboardingData;
  isLoading?: boolean;
  progress?: number;
  currentOperation?: string;
}

/**
 * Step finale: Configurazione completata
 * Componente ottimizzato seguendo principi UI/Logic separation
 */
export const OnboardingCompletedStep = memo<OnboardingCompletedStepProps>(
  ({ onComplete, completedData, isLoading = false, progress = 100, currentOperation = "" }) => {
    // Se stiamo ancora processando, mostra il progresso
    if (isLoading) {
      return (
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Finalizzazione in corso...</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">{currentOperation}</p>
          </div>

          {/* Barra di progresso */}
          <div className="max-w-md mx-auto">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{progress.toFixed(0)}% completato</p>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center space-y-8">
        {/* Icona di successo */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <SparklesIcon className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Messaggio di successo */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🎉 Configurazione completata!</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Perfetto! Hai configurato con successo il tuo gruppo, le persone, i conti e i budget.
          </p>
        </div>

        {/* Riepilogo dettagliato dei dati creati */}
        {completedData && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 max-w-lg mx-auto">
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-4">Riepilogo configurazione:</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between text-green-800 dark:text-green-200">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    ✓
                  </span>
                  <span>Gruppo: {completedData.group.name}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-green-800 dark:text-green-200">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    ✓
                  </span>
                  <span>Persone aggiunte</span>
                </div>
                <span className="text-sm font-medium">{completedData.people.length}</span>
              </div>
              <div className="flex items-center justify-between text-green-800 dark:text-green-200">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    ✓
                  </span>
                  <span>Account creati</span>
                </div>
                <span className="text-sm font-medium">{completedData.accounts.length}</span>
              </div>
              <div className="flex items-center justify-between text-green-800 dark:text-green-200">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    ✓
                  </span>
                  <span>Budget configurati</span>
                </div>
                <span className="text-sm font-medium">{completedData.budgets.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Fallback riepilogo generico se non ci sono dati */}
        {!completedData && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-4">Cosa hai creato:</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center text-green-800 dark:text-green-200">
                <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  ✓
                </span>
                <span>Gruppo configurato</span>
              </div>
              <div className="flex items-center text-green-800 dark:text-green-200">
                <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  ✓
                </span>
                <span>Persone aggiunte al gruppo</span>
              </div>
              <div className="flex items-center text-green-800 dark:text-green-200">
                <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  ✓
                </span>
                <span>Conti creati per ogni persona</span>
              </div>
              <div className="flex items-center text-green-800 dark:text-green-200">
                <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  ✓
                </span>
                <span>Budget impostati</span>
              </div>
            </div>
          </div>
        )}

        {/* Prossimi passi */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">Prossimi passi:</h3>
          <div className="text-left space-y-2 text-blue-800 dark:text-blue-200">
            <p>• Inizia ad aggiungere le tue transazioni</p>
            <p>• Monitora i tuoi budget</p>
            <p>• Esplora i report e le analisi</p>
            <p>• Invita altri membri al gruppo (opzionale)</p>
          </div>
        </div>

        {/* Pulsante di completamento */}
        <div className="pt-4">
          <button
            onClick={onComplete}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Inizia ad usare Wealth Pillar 🚀
          </button>
        </div>

        {/* Messaggio di incoraggiamento */}
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Sei pronto per prendere il controllo delle tue finanze! Benvenuto in Wealth Pillar.
        </p>
      </div>
    );
  }
);

OnboardingCompletedStep.displayName = "OnboardingCompletedStep";

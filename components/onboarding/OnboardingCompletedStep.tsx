import React, { memo } from 'react';
import { SparklesIcon } from '../common/Icons';

interface OnboardingCompletedStepProps {
  onComplete: () => void;
}

/**
 * Step finale: Configurazione completata
 * Principio SRP: Single Responsibility - gestisce solo la schermata di completamento
 */
export const OnboardingCompletedStep = memo<OnboardingCompletedStepProps>(({ 
  onComplete 
}) => {
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          🎉 Configurazione completata!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Perfetto! Hai configurato con successo il tuo gruppo, le persone, i conti e i budget.
        </p>
      </div>

      {/* Riepilogo delle attività completate */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-4">
          Cosa hai creato:
        </h3>
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

      {/* Prossimi passi */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
          Prossimi passi:
        </h3>
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
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          Inizia ad usare Wealth Pillar 🚀
        </button>
      </div>

      {/* Messaggio di incoraggiamento */}
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
        Sei pronto per prendere il controllo delle tue finanze! 
        Benvenuto in Wealth Pillar.
      </p>
    </div>
  );
});

OnboardingCompletedStep.displayName = 'OnboardingCompletedStep';

import React, { memo } from 'react';
import { Transaction } from '../../types';
import { LinkIcon } from '../common';

/**
 * Props per il componente LinkingStatusBar
 */
interface LinkingStatusBarProps {
  linkingTx: Transaction;
  onCancelLink: () => void;
}

/**
 * Componente per la barra di stato durante la riconciliazione
 * Principio SRP: Single Responsibility - gestisce solo l'UI del linking status
 */
export const LinkingStatusBar = memo<LinkingStatusBarProps>(({
  linkingTx,
  onCancelLink
}) => {
  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Modalità Riconciliazione Attiva
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Seleziona una transazione da riconciliare con{' '}
              <span className="font-medium px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded-md">
                "{linkingTx.description}"
              </span>
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              💡 Clicca su una transazione di tipo opposto per collegarla
            </p>
          </div>
        </div>
        <button 
          onClick={onCancelLink} 
          className="flex-shrink-0 p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-colors"
          aria-label="Annulla riconciliazione"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
});

LinkingStatusBar.displayName = 'LinkingStatusBar';

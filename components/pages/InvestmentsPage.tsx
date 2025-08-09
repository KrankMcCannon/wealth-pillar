import React, { useState, memo, useCallback } from 'react';
import { usePersonFilter } from '../../hooks/usePersonFilter';
import { useInvestmentFilter } from '../../hooks/useDataFilters';
import { PageHeader } from '../ui/PageHeader';
import { PortfolioSummary, InvestmentTable } from '../investments/InvestmentComponents';
import { CompoundInterestCalculator } from '../investments/CompoundInterestCalculator';
import { AddInvestmentModal } from '../AddInvestmentModal';

// Simple plus icon as SVG component
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

/**
 * Hook per gestire lo stato dei modali
 * Principio SRP: Single Responsibility - gestisce solo lo stato dei modali
 */
const useInvestmentModals = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return {
    isModalOpen,
    openModal,
    closeModal,
  };
};

/**
 * Componente per il pulsante di aggiunta investimento
 * Principio SRP: Single Responsibility - gestisce solo il pulsante di aggiunta
 */
const AddInvestmentButton = memo<{ onClick: () => void }>(({ onClick }) => (
  <button
    onClick={onClick}
    style={{ backgroundColor: 'var(--theme-color)' }}
    className="flex items-center text-white font-bold py-2 px-4 rounded-lg shadow-md hover:opacity-90 transition-opacity"
  >
    <PlusIcon />
    <span className="ml-2">Aggiungi investimento</span>
  </button>
));

AddInvestmentButton.displayName = 'AddInvestmentButton';

/**
 * Pagina Investimenti ottimizzata
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione degli investimenti
 * Principio DRY: Don't Repeat Yourself - usa componenti riutilizzabili
 * Principio OCP: Open/Closed - estendibile per nuovi tipi di investimenti
 */
export const InvestmentsPage = memo(() => {
  const { selectedPersonId, isAllView, getPersonName } = usePersonFilter();
  const { investments } = useInvestmentFilter(selectedPersonId);
  const { isModalOpen, openModal, closeModal } = useInvestmentModals();

  return (
    <>
      <div className="space-y-8">
        <PageHeader title="Investimenti">
          <AddInvestmentButton onClick={openModal} />
        </PageHeader>

        <PortfolioSummary holdings={investments} />

        <InvestmentTable
          holdings={investments}
          isAllView={isAllView}
          getPersonName={getPersonName}
        />

        <CompoundInterestCalculator />
      </div>

      <AddInvestmentModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </>
  );
});

InvestmentsPage.displayName = 'InvestmentsPage';

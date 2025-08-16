import { memo } from 'react';
import { useInvestmentFilter, useInvestmentModals, usePersonFilter } from '../../hooks';
import { PageHeader } from '../ui';
import { CompoundInterestCalculator, PortfolioSummary, InvestmentTable } from '../investments';
import { AddInvestmentModal } from '../modals';
import { PlusIcon } from '../common';

/**
 * Componente per il pulsante di aggiunta investimento
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
 * Pagina Investimenti
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

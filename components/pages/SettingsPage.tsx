import React, { memo } from 'react';
import { PageHeader } from '../ui';
import {
  useAccountFilter,
  useBudgetFilter,
  useFinance,
  usePersonFilter,
  useSettingsModals,
} from '../../hooks';
import { 
  UserProfileSection, 
  AccountManagementSection, 
  BudgetManagementSection 
} from '../settings';
import { 
  EditAccountModal, 
  AddAccountModal, 
  EditPersonModal, 
  EditBudgetModal 
} from '../modals';

/**
 * Pagina Impostazioni ottimizzata
 * Principio SRP: Single Responsibility - gestisce solo il layout e la coordinazione dei componenti
 * Principio DRY: Don't Repeat Yourself - usa hook e componenti riutilizzabili
 * Principio OCP: Open/Closed - estendibile per nuove sezioni di impostazioni
 */
export const SettingsPage = memo(() => {
  const { people, getPersonById, getCalculatedBalance } = useFinance();
  const { selectedPersonId, isAllView, getPersonName } = usePersonFilter();
  const { accounts } = useAccountFilter(selectedPersonId);
  const { budgets } = useBudgetFilter(selectedPersonId);
  
  const {
    // Stati modali
    isEditAccountModalOpen,
    isEditPersonModalOpen,
    isEditBudgetModalOpen,
    isAddAccountModalOpen,
    
    // Elementi selezionati
    selectedAccount,
    selectedPerson,
    selectedBudget,
    
    // Handlers account
    openEditAccountModal,
    closeEditAccountModal,
    openAddAccountModal,
    closeAddAccountModal,
    
    // Handlers person
    openEditPersonModal,
    closeEditPersonModal,
    
    // Handlers budget
    openEditBudgetModal,
    closeEditBudgetModal,
  } = useSettingsModals();

  // Filtra le persone in base alla vista corrente
  const displayedPeople = isAllView
    ? people
    : people.filter(p => p.id === selectedPersonId);

  return (
    <>
      <div className="space-y-8">
        <PageHeader title="Impostazioni" />

        <UserProfileSection
          people={displayedPeople}
          onEditPerson={openEditPersonModal}
        />

        <AccountManagementSection
          accounts={accounts}
          isAllView={isAllView}
          onEditAccount={openEditAccountModal}
          onAddAccount={openAddAccountModal}
          getPersonName={getPersonName}
          getCalculatedBalance={getCalculatedBalance}
        />

        <BudgetManagementSection
          budgets={budgets}
          isAllView={isAllView}
          onEditBudget={openEditBudgetModal}
          getPersonName={getPersonName}
        />
      </div>

      {/* Modali */}
      <EditAccountModal
        isOpen={isEditAccountModalOpen}
        onClose={closeEditAccountModal}
        account={selectedAccount}
      />
      
      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={closeAddAccountModal}
      />
      
      <EditPersonModal
        isOpen={isEditPersonModalOpen}
        onClose={closeEditPersonModal}
        person={selectedPerson}
      />
      
      <EditBudgetModal
        isOpen={isEditBudgetModalOpen}
        onClose={closeEditBudgetModal}
        budget={selectedBudget}
      />
    </>
  );
});

SettingsPage.displayName = 'SettingsPage';

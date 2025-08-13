import React, { memo } from 'react';
import { PageHeader } from '../ui';
import {
  useAccountFilter,
  useBudgetFilter,
  useFinance,
  usePersonFilter,
  useSettingsModals,
  useGroups,
} from '../../hooks';
import { 
  UserProfileSection, 
  AccountManagementSection, 
  BudgetManagementSection 
} from '../settings';
import { GroupSettings } from '../groups';
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
  const { people, getCalculatedBalanceSync } = useFinance();
  const { selectedPersonId, isAllView, getPersonName } = usePersonFilter();
  const { accounts } = useAccountFilter(selectedPersonId);
  const { budgets } = useBudgetFilter(selectedPersonId);
  
  // Hook per la gestione dei gruppi
  const {
    currentGroup,
    isLoading: groupsLoading,
    canManageGroup,
    updateGroup,
    deleteGroup,
  } = useGroups();
  
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

  // Handlers per le azioni del gruppo
  const handleUpdateGroup = async (updates: { name?: string; description?: string }) => {
    if (!currentGroup) return;
    await updateGroup(currentGroup.id, updates);
  };

  const handleDeleteGroup = async () => {
    if (!currentGroup) return;
    await deleteGroup(currentGroup.id);
  };

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

        {/* Sezione Gestione Gruppo */}
        <GroupSettings
          group={currentGroup}
          isLoading={groupsLoading}
          canManageGroup={canManageGroup()}
          onUpdateGroup={handleUpdateGroup}
          onDeleteGroup={handleDeleteGroup}
        />

        <AccountManagementSection
          accounts={accounts}
          isAllView={isAllView}
          onEditAccount={openEditAccountModal}
          onAddAccount={openAddAccountModal}
          getPersonName={getPersonName}
          getCalculatedBalanceSync={getCalculatedBalanceSync}
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

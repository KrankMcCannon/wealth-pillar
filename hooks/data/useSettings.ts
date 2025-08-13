import { useCallback } from 'react';
import { Account, Budget, Person } from '../../types';
import { useModalWithData, useMultipleModals } from '../ui/useModal';

/**
 * Enum per i tipi di modali delle impostazioni
 * Principio OCP: Open/Closed - facilita l'aggiunta di nuovi modali
 */
export enum SettingsModalType {
  ADD_ACCOUNT = 'add_account',
  EDIT_ACCOUNT = 'edit_account',
  EDIT_PERSON = 'edit_person',
  EDIT_BUDGET = 'edit_budget',
}

/**
 * Hook generico per modali di editing con dati tipizzati
 * Principio SRP: Single Responsibility - gestisce un solo tipo di modale
 * Principio DRY: Don't Repeat Yourself - riutilizzabile per qualsiasi entità
 * Principio OCP: Open/Closed - estendibile per nuovi tipi
 */
function useEntityModal<T>() {
  const { isOpen, data, openModal, closeModal, updateData } = useModalWithData<T>();

  const openEditModal = useCallback((entity: T) => {
    openModal(entity);
  }, [openModal]);

  const closeEditModal = useCallback(() => {
    closeModal();
  }, [closeModal]);

  return {
    isOpen,
    data: data as T | undefined,
    openEditModal,
    closeEditModal,
    updateData,
  };
}

/**
 * Hook ottimizzato per gestire tutti i modali delle impostazioni
 * Principio SRP: Single Responsibility - orchestra i modali ma non gestisce la logica specifica
 * Principio DRY: Don't Repeat Yourself - usa hook generici per evitare duplicazioni
 * Principio OCP: Open/Closed - facilmente estendibile per nuovi modali
 * Principio DIP: Dependency Inversion - dipende da astrazioni (hook generici)
 */
export const useSettingsModals = () => {
  // Hook per modali senza dati (es. add)
  const { 
    isModalOpen, 
    openModal, 
    closeModal 
  } = useMultipleModals([SettingsModalType.ADD_ACCOUNT]);

  // Hook specializzati per editing con dati
  const accountModal = useEntityModal<Account>();
  const personModal = useEntityModal<Person>();
  const budgetModal = useEntityModal<Budget>();

  // Wrapper functions con nomi semantici per retrocompatibilità
  const openAddAccountModal = useCallback(() => {
    openModal(SettingsModalType.ADD_ACCOUNT);
  }, [openModal]);

  const closeAddAccountModal = useCallback(() => {
    closeModal(SettingsModalType.ADD_ACCOUNT);
  }, [closeModal]);

  const isAddAccountModalOpen = isModalOpen(SettingsModalType.ADD_ACCOUNT);

  return {
    // === Modali senza dati ===
    isAddAccountModalOpen,
    openAddAccountModal,
    closeAddAccountModal,

    // === Modali Account ===
    isEditAccountModalOpen: accountModal.isOpen,
    selectedAccount: accountModal.data,
    openEditAccountModal: accountModal.openEditModal,
    closeEditAccountModal: accountModal.closeEditModal,
    updateSelectedAccount: accountModal.updateData,

    // === Modali Person ===
    isEditPersonModalOpen: personModal.isOpen,
    selectedPerson: personModal.data,
    openEditPersonModal: personModal.openEditModal,
    closeEditPersonModal: personModal.closeEditModal,
    updateSelectedPerson: personModal.updateData,

    // === Modali Budget ===
    isEditBudgetModalOpen: budgetModal.isOpen,
    selectedBudget: budgetModal.data,
    openEditBudgetModal: budgetModal.openEditModal,
    closeEditBudgetModal: budgetModal.closeEditModal,
    updateSelectedBudget: budgetModal.updateData,

    // === Utility functions ===
    /**
     * Chiude tutti i modali aperti
     * Principio SRP: Single Responsibility - utility per reset completo
     */
    closeAllModals: useCallback(() => {
      closeModal(SettingsModalType.ADD_ACCOUNT);
      accountModal.closeEditModal();
      personModal.closeEditModal();
      budgetModal.closeEditModal();
    }, [closeModal, accountModal.closeEditModal, personModal.closeEditModal, budgetModal.closeEditModal]),

    /**
     * Verifica se almeno un modale è aperto
     * Principio SRP: Single Responsibility - utility per stato globale
     */
    hasOpenModals: isAddAccountModalOpen || accountModal.isOpen || personModal.isOpen || budgetModal.isOpen,
  };
};

/**
 * Hook specializzato per modali di Account
 * Principio SRP: Single Responsibility - gestisce solo modali Account
 * Principio DRY: Don't Repeat Yourself - riusa logica generica
 */
export const useAccountModals = () => {
  const { 
    isAddAccountModalOpen,
    openAddAccountModal,
    closeAddAccountModal,
    isEditAccountModalOpen,
    selectedAccount,
    openEditAccountModal,
    closeEditAccountModal,
    updateSelectedAccount
  } = useSettingsModals();

  return {
    // Add modal
    isAddModalOpen: isAddAccountModalOpen,
    openAddModal: openAddAccountModal,
    closeAddModal: closeAddAccountModal,
    
    // Edit modal
    isEditModalOpen: isEditAccountModalOpen,
    selectedItem: selectedAccount,
    openEditModal: openEditAccountModal,
    closeEditModal: closeEditAccountModal,
    updateSelectedItem: updateSelectedAccount,
  };
};

/**
 * Hook specializzato per modali di Person
 * Principio SRP: Single Responsibility - gestisce solo modali Person
 */
export const usePersonModals = () => {
  const { 
    isEditPersonModalOpen,
    selectedPerson,
    openEditPersonModal,
    closeEditPersonModal,
    updateSelectedPerson
  } = useSettingsModals();

  return {
    isEditModalOpen: isEditPersonModalOpen,
    selectedItem: selectedPerson,
    openEditModal: openEditPersonModal,
    closeEditModal: closeEditPersonModal,
    updateSelectedItem: updateSelectedPerson,
  };
};

/**
 * Hook specializzato per modali di Budget
 * Principio SRP: Single Responsibility - gestisce solo modali Budget
 */
export const useBudgetModals = () => {
  const { 
    isEditBudgetModalOpen,
    selectedBudget,
    openEditBudgetModal,
    closeEditBudgetModal,
    updateSelectedBudget
  } = useSettingsModals();

  return {
    isEditModalOpen: isEditBudgetModalOpen,
    selectedItem: selectedBudget,
    openEditModal: openEditBudgetModal,
    closeEditModal: closeEditBudgetModal,
    updateSelectedItem: updateSelectedBudget,
  };
};

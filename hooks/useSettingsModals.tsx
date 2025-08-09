import { useState, useCallback } from 'react';
import { Account, Person, Budget } from '../types';

/**
 * Hook per gestire i modali della SettingsPage
 * Principio SRP: Single Responsibility - gestisce solo lo stato dei modali
 */
export const useSettingsModals = () => {
  // Stati per i modali di modifica
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [isEditPersonModalOpen, setIsEditPersonModalOpen] = useState(false);
  const [isEditBudgetModalOpen, setIsEditBudgetModalOpen] = useState(false);
  
  // Stati per il modale di aggiunta
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  
  // Stati per gli elementi selezionati
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Handlers per account
  const openEditAccountModal = useCallback((account: Account) => {
    setSelectedAccount(account);
    setIsEditAccountModalOpen(true);
  }, []);

  const closeEditAccountModal = useCallback(() => {
    setIsEditAccountModalOpen(false);
    setSelectedAccount(null);
  }, []);

  const openAddAccountModal = useCallback(() => {
    setIsAddAccountModalOpen(true);
  }, []);

  const closeAddAccountModal = useCallback(() => {
    setIsAddAccountModalOpen(false);
  }, []);

  // Handlers per person
  const openEditPersonModal = useCallback((person: Person) => {
    setSelectedPerson(person);
    setIsEditPersonModalOpen(true);
  }, []);

  const closeEditPersonModal = useCallback(() => {
    setIsEditPersonModalOpen(false);
    setSelectedPerson(null);
  }, []);

  // Handlers per budget
  const openEditBudgetModal = useCallback((budget: Budget) => {
    setSelectedBudget(budget);
    setIsEditBudgetModalOpen(true);
  }, []);

  const closeEditBudgetModal = useCallback(() => {
    setIsEditBudgetModalOpen(false);
    setSelectedBudget(null);
  }, []);

  return {
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
  };
};

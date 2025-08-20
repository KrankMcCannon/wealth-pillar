import { useCallback, useState, useMemo, useEffect } from 'react';
import { Account, Budget, Person } from '../../types';
import { useModalForm } from '../ui/useModalForm';
import { validateAccountForm, validateBudgetForm, validatePersonForm } from '../utils/validators';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Enum per gli step dell'onboarding
 */
export enum OnboardingStep {
  WELCOME = 'welcome',
  GROUP = 'group',
  PEOPLE = 'people',
  ACCOUNTS = 'accounts',
  BUDGETS = 'budgets',
  COMPLETION = 'completion'
}

/**
 * Interface per lo stato dell'onboarding
 */
interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  groupName: string;
  people: Partial<Person>[];
  accounts: Partial<Account>[];
  budgets: Partial<Budget>[];
  isCompleted: boolean;
}

/**
 * Hook consolidato per tutto il processo di onboarding
 * Principio SRP: Single Responsibility - gestisce tutto l'onboarding
 * Principio DRY: Don't Repeat Yourself - unifica tutta la logica onboarding
 */
export const useOnboarding = () => {
  // === AUTH & USER MANAGEMENT ===
  const { user, isLoaded: userLoaded } = useAuth();
  
  // === STATE MANAGEMENT ===
  
  const [state, setState] = useState<OnboardingState>({
    currentStep: OnboardingStep.WELCOME,
    completedSteps: [],
    groupName: '',
    people: [],
    accounts: [],
    budgets: [],
    isCompleted: false,
  });
  
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Load user-specific onboarding state when user changes
  useEffect(() => {
    if (!userLoaded) {
      setIsStateLoaded(false);
      return;
    }
    
    if (!user?.id) {
      setState({
        currentStep: OnboardingStep.WELCOME,
        completedSteps: [],
        groupName: '',
        people: [],
        accounts: [],
        budgets: [],
        isCompleted: false,
      });
      setIsStateLoaded(true);
      return;
    }
    
    const saved = localStorage.getItem(`onboarding_state_${user.id}`);
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse onboarding state:', error);
        setState({
          currentStep: OnboardingStep.WELCOME,
          completedSteps: [],
          groupName: '',
          people: [],
          accounts: [],
          budgets: [],
          isCompleted: false,
        });
      }
    } else {
      setState({
        currentStep: OnboardingStep.WELCOME,
        completedSteps: [],
        groupName: '',
        people: [],
        accounts: [],
        budgets: [],
        isCompleted: false,
      });
    }
    setIsStateLoaded(true);
  }, [user?.id, userLoaded]);

  // Persiste lo stato nell'localStorage
  const persistState = useCallback((newState: OnboardingState) => {
    if (user?.id) {
      localStorage.setItem(`onboarding_state_${user.id}`, JSON.stringify(newState));
    }
    setState(newState);
  }, [user?.id]);

  // === NAVIGATION ===

  const stepOrder: OnboardingStep[] = [
    OnboardingStep.WELCOME,
    OnboardingStep.GROUP,
    OnboardingStep.PEOPLE,
    OnboardingStep.ACCOUNTS,
    OnboardingStep.BUDGETS,
    OnboardingStep.COMPLETION
  ];

  const currentStepIndex = stepOrder.indexOf(state.currentStep);
  const totalSteps = stepOrder.length;
  const progressPercentage = currentStepIndex >= 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  const goToStep = useCallback((step: OnboardingStep) => {
    const newState = { ...state, currentStep: step };
    persistState(newState);
  }, [state, persistState]);

  const goToNextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepOrder.length) {
      const nextStep = stepOrder[nextIndex];
      const newState = {
        ...state,
        currentStep: nextStep,
        completedSteps: [...new Set([...state.completedSteps, state.currentStep])]
      };
      persistState(newState);
    }
  }, [currentStepIndex, stepOrder, state, persistState]);

  const goToPreviousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = stepOrder[prevIndex];
      const newState = { ...state, currentStep: prevStep };
      persistState(newState);
    }
  }, [currentStepIndex, stepOrder, state, persistState]);

  // === GROUP FORM ===

  const groupForm = useModalForm({
    initialData: { name: state.groupName },
    resetOnClose: false,
  });

  const handleGroupSubmit = useCallback(() => {
    if (!groupForm.data.name.trim()) {
      groupForm.setError('name', 'Il nome del gruppo è obbligatorio');
      return false;
    }

    const newState = { ...state, groupName: groupForm.data.name.trim() };
    persistState(newState);
    goToNextStep();
    return true;
  }, [groupForm, state, persistState, goToNextStep]);

  // === PEOPLE MANAGEMENT ===

  const [editingPersonIndex, setEditingPersonIndex] = useState<number | null>(null);
  
  const personForm = useModalForm({
    initialData: { name: '', avatar: '' },
    resetOnClose: true,
  });

  const openPersonForm = useCallback((index?: number) => {
    if (index !== undefined && state.people[index]) {
      const person = state.people[index];
      personForm.updateData(person);
      setEditingPersonIndex(index);
    } else {
      personForm.resetForm();
      setEditingPersonIndex(null);
    }
  }, [state.people, personForm]);

  const savePersonForm = useCallback(() => {
    const errors = validatePersonForm(personForm.data);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        personForm.setError(field, message);
      });
      return false;
    }

    const newPerson = {
      ...personForm.data,
      id: editingPersonIndex !== null ? state.people[editingPersonIndex]?.id || `temp_${Date.now()}` : `temp_${Date.now()}`,
    };

    let newPeople = [...state.people];
    if (editingPersonIndex !== null) {
      newPeople[editingPersonIndex] = newPerson;
    } else {
      newPeople.push(newPerson);
    }

    const newState = { ...state, people: newPeople };
    persistState(newState);
    
    personForm.resetForm();
    setEditingPersonIndex(null);
    return true;
  }, [personForm, editingPersonIndex, state, persistState]);

  const removePerson = useCallback((index: number) => {
    const newPeople = state.people.filter((_, i) => i !== index);
    const newState = { ...state, people: newPeople };
    persistState(newState);
  }, [state, persistState]);

  // === ACCOUNTS MANAGEMENT ===

  const [editingAccountIndex, setEditingAccountIndex] = useState<number | null>(null);
  
  const accountForm = useModalForm({
    initialData: { name: '', type: 'stipendio' as 'stipendio' | 'risparmio' | 'contanti' | 'investimenti', selectedPersonIds: [] },
    resetOnClose: true,
  });

  const availableAccountTypes = [
    { value: 'stipendio', label: 'Stipendio' },
    { value: 'risparmi', label: 'Risparmi' },
    { value: 'contanti', label: 'Contanti' },
    { value: 'investimenti', label: 'Investimenti' },
  ];

  const peopleOptions = useMemo(() => 
    state.people.map(person => ({
      id: person.id!,
      label: person.name!,
      checked: accountForm.data.selectedPersonIds.includes(person.id!),
    })),
    [state.people, accountForm.data.selectedPersonIds]
  );

  const openAccountForm = useCallback((index?: number) => {
    if (index !== undefined && state.accounts[index]) {
      const account = state.accounts[index];
      accountForm.updateData({
        name: account.name || '',
        type: account.type || 'stipendio',
        selectedPersonIds: account.personIds || [],
      });
      setEditingAccountIndex(index);
    } else {
      accountForm.resetForm();
      setEditingAccountIndex(null);
    }
  }, [state.accounts, accountForm]);

  const saveAccountForm = useCallback(() => {
    const errors = validateAccountForm({
      name: accountForm.data.name,
      selectedPersonIds: accountForm.data.selectedPersonIds,
    });
    
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        accountForm.setError(field, message);
      });
      return false;
    }

    const newAccount = {
      ...accountForm.data,
      id: editingAccountIndex !== null ? state.accounts[editingAccountIndex]?.id || `temp_${Date.now()}` : `temp_${Date.now()}`,
      personIds: accountForm.data.selectedPersonIds,
      balance: 0,
    };

    let newAccounts = [...state.accounts];
    if (editingAccountIndex !== null) {
      newAccounts[editingAccountIndex] = newAccount;
    } else {
      newAccounts.push(newAccount);
    }

    const newState = { ...state, accounts: newAccounts };
    persistState(newState);
    
    accountForm.resetForm();
    setEditingAccountIndex(null);
    return true;
  }, [accountForm, editingAccountIndex, state, persistState]);

  const removeAccount = useCallback((index: number) => {
    const newAccounts = state.accounts.filter((_, i) => i !== index);
    const newState = { ...state, accounts: newAccounts };
    persistState(newState);
  }, [state, persistState]);

  const handlePersonToggleForAccount = useCallback((personId: string, checked: boolean) => {
    const currentIds = accountForm.data.selectedPersonIds;
    const newSelectedIds = checked
      ? [...currentIds, personId]
      : currentIds.filter(id => id !== personId);

    accountForm.updateField("selectedPersonIds", newSelectedIds);
  }, [accountForm]);

  // === BUDGETS MANAGEMENT ===

  const [editingBudgetIndex, setEditingBudgetIndex] = useState<number | null>(null);
  
  const budgetForm = useModalForm({
    initialData: { name: '', amount: 0, category: '', selectedPersonIds: [] },
    resetOnClose: true,
  });

  const budgetPeopleOptions = useMemo(() => 
    state.people.map(person => ({
      id: person.id!,
      label: person.name!,
      checked: budgetForm.data.selectedPersonIds.includes(person.id!),
    })),
    [state.people, budgetForm.data.selectedPersonIds]
  );

  const openBudgetForm = useCallback((index?: number) => {
    if (index !== undefined && state.budgets[index]) {
      const budget = state.budgets[index];
      budgetForm.updateData({
        name: budget.description || '',
        amount: budget.amount || 0,
        category: budget.categories?.[0] || '',
        selectedPersonIds: budget.personId ? [budget.personId] : [],
      });
      setEditingBudgetIndex(index);
    } else {
      budgetForm.resetForm();
      setEditingBudgetIndex(null);
    }
  }, [state.budgets, budgetForm]);

  const saveBudgetForm = useCallback(() => {
    const errors = validateBudgetForm({
      description: budgetForm.data.name,
      amount: budgetForm.data.amount.toString(),
      selectedCategories: [budgetForm.data.category],
    });
    
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        budgetForm.setError(field, message);
      });
      return false;
    }

    const newBudget = {
      ...budgetForm.data,
      id: editingBudgetIndex !== null ? state.budgets[editingBudgetIndex]?.id || `temp_${Date.now()}` : `temp_${Date.now()}`,
      personIds: budgetForm.data.selectedPersonIds,
    };

    let newBudgets = [...state.budgets];
    if (editingBudgetIndex !== null) {
      newBudgets[editingBudgetIndex] = newBudget;
    } else {
      newBudgets.push(newBudget);
    }

    const newState = { ...state, budgets: newBudgets };
    persistState(newState);
    
    budgetForm.resetForm();
    setEditingBudgetIndex(null);
    return true;
  }, [budgetForm, editingBudgetIndex, state, persistState]);

  const removeBudget = useCallback((index: number) => {
    const newBudgets = state.budgets.filter((_, i) => i !== index);
    const newState = { ...state, budgets: newBudgets };
    persistState(newState);
  }, [state, persistState]);

  const handlePersonToggleForBudget = useCallback((personId: string, checked: boolean) => {
    const currentIds = budgetForm.data.selectedPersonIds;
    const newSelectedIds = checked
      ? [...currentIds, personId]
      : currentIds.filter(id => id !== personId);

    budgetForm.updateField("selectedPersonIds", newSelectedIds);
  }, [budgetForm]);

  // === COMPLETION ===

  const completeOnboarding = useCallback(async () => {
    try {
      // Here would be the actual API calls to create the data
      console.log('Completing onboarding with:', state);
      
      const newState = { 
        ...state, 
        isCompleted: true,
        completedSteps: [...new Set([...state.completedSteps, state.currentStep])]
      };
      persistState(newState);
      
      // Clear from localStorage after completion
      localStorage.removeItem('onboarding_state');
      
      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }
  }, [state, persistState]);

  const resetOnboarding = useCallback(() => {
    const initialState: OnboardingState = {
      currentStep: OnboardingStep.WELCOME,
      completedSteps: [],
      groupName: '',
      people: [],
      accounts: [],
      budgets: [],
      isCompleted: false,
    };
    localStorage.removeItem('onboarding_state');
    setState(initialState);
  }, []);

  // === VALIDATION ===

  const canProceedToNextStep = useMemo(() => {
    switch (state.currentStep) {
      case OnboardingStep.WELCOME:
        return true;
      case OnboardingStep.GROUP:
        return state.groupName.trim().length > 0;
      case OnboardingStep.PEOPLE:
        return state.people.length > 0;
      case OnboardingStep.ACCOUNTS:
        return state.accounts.length > 0;
      case OnboardingStep.BUDGETS:
        return true; // Budgets are optional
      case OnboardingStep.COMPLETION:
        return true;
      default:
        return false;
    }
  }, [state]);

  return {
    // State
    state,
    currentStep: state.currentStep,
    completedSteps: state.completedSteps,
    isCompleted: state.isCompleted,
    
    // Navigation
    totalSteps,
    currentStepIndex,
    progressPercentage,
    canProceedToNextStep,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    
    // Group
    groupForm,
    handleGroupSubmit,
    
    // People
    personForm,
    editingPersonIndex,
    openPersonForm,
    savePersonForm,
    removePerson,
    
    // Accounts
    accountForm,
    editingAccountIndex,
    availableAccountTypes,
    peopleOptions,
    openAccountForm,
    saveAccountForm,
    removeAccount,
    handlePersonToggleForAccount,
    
    // Budgets
    budgetForm,
    editingBudgetIndex,
    budgetPeopleOptions,
    openBudgetForm,
    saveBudgetForm,
    removeBudget,
    handlePersonToggleForBudget,
    
    // Completion
    completeOnboarding,
    resetOnboarding,
    
    // Loading state
    isStateLoaded,
  };
};
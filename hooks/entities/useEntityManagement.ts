import { useCallback, useMemo } from "react";
import { useFinance, useModalForm } from "../";
import { validateAccountForm, validateBudgetForm, validatePersonForm } from "../utils/validators";

/**
 * Hook generico per gestire operazioni CRUD su entità
 * Principio SRP: Single Responsibility - gestisce operazioni su una singola entità
 * Principio DRY: Don't Repeat Yourself - logica unificata per Add/Edit
 * Principio OCP: Open/Closed - estendibile per nuove entità
 */
function useEntityCRUD<TEntity, TFormData>(config: {
  entityType: 'account' | 'budget' | 'person' | 'investment';
  initialFormData: TFormData;
  validator: (data: TFormData) => Record<string, string>;
  createFn: (data: any) => Promise<TEntity>;
  updateFn?: (id: string, data: any) => Promise<TEntity>;
  mapFormToEntity: (formData: TFormData, existingEntity?: TEntity) => any;
}) {
  const { data, errors, isSubmitting, updateField, setError, clearAllErrors, setSubmitting, resetForm } = useModalForm({
    initialData: config.initialFormData,
    resetOnClose: true,
    resetOnOpen: true,
  });

  const validateForm = useCallback((): boolean => {
    clearAllErrors();
    const errorsObj = config.validator(data);
    Object.entries(errorsObj).forEach(([field, message]) => {
      setError(field, message);
    });
    return Object.keys(errorsObj).length === 0;
  }, [data, clearAllErrors, setError, config.validator]);

  const handleSubmit = useCallback(async (
    e: React.FormEvent,
    onClose: () => void,
    existingEntity?: TEntity & { id: string }
  ) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const entityData = config.mapFormToEntity(data, existingEntity);
      
      if (existingEntity && config.updateFn) {
        await config.updateFn(existingEntity.id, entityData);
      } else {
        await config.createFn(entityData);
      }
      
      onClose();
    } catch (err) {
      setError("general", err instanceof Error ? err.message : `Errore durante l'operazione su ${config.entityType}`);
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, setSubmitting, data, config, setError]);

  const canSubmit = useMemo(() => {
    return Object.keys(config.validator(data)).length === 0;
  }, [data, config.validator]);

  return {
    data,
    errors,
    isSubmitting,
    canSubmit,
    updateField,
    handleSubmit,
    resetForm,
    validateForm,
  };
}

/**
 * Hook specifico per Account
 */
export const useAccountManagement = (existingAccount?: any) => {
  const { addAccount, updateAccount, people } = useFinance();

  const initialFormData = useMemo(() => ({
    name: existingAccount?.name || "",
    type: existingAccount?.type || "stipendio" as "stipendio" | "risparmio" | "contanti" | "investimenti",
    selectedPersonIds: existingAccount?.personIds || [],
  }), [existingAccount]);

  const accountTypeOptions = useMemo(() => [
    { value: "stipendio", label: "Stipendio" },
    { value: "risparmi", label: "Risparmi" },
    { value: "contanti", label: "Contanti" },
    { value: "investimenti", label: "Investimenti" },
  ], []);

  const peopleOptions = useMemo(() => 
    people.map(person => ({
      id: person.id,
      label: person.name,
      checked: initialFormData.selectedPersonIds.includes(person.id),
    })),
    [people, initialFormData.selectedPersonIds]
  );

  const crud = useEntityCRUD({
    entityType: 'account',
    initialFormData,
    validator: (data) => validateAccountForm({
      name: data.name,
      selectedPersonIds: data.selectedPersonIds,
    }),
    createFn: addAccount,
    updateFn: async (id: string, data: any) => {
      await updateAccount({ id, ...data });
      return { id, ...data };
    },
    mapFormToEntity: (formData) => ({
      name: formData.name.trim(),
      type: formData.type,
      personIds: formData.selectedPersonIds,
      balance: existingAccount?.balance || 0,
      groupId: existingAccount?.groupId || null,
    }),
  });

  const handlePersonToggle = useCallback((personId: string, checked: boolean) => {
    const currentIds = crud.data.selectedPersonIds;
    const newSelectedIds = checked
      ? [...currentIds, personId]
      : currentIds.filter(id => id !== personId);

    crud.updateField("selectedPersonIds", newSelectedIds);
  }, [crud]);

  return {
    ...crud,
    accountTypeOptions,
    peopleOptions,
    handlePersonToggle,
  };
};

/**
 * Hook specifico per Budget
 */
export const useBudgetManagement = (existingBudget?: any) => {
  const { addBudget, updateBudget, people } = useFinance();

  const initialFormData = useMemo(() => ({
    name: existingBudget?.name || "",
    amount: existingBudget?.amount || 0,
    category: existingBudget?.category || "",
    selectedPersonIds: existingBudget?.personIds || [],
  }), [existingBudget]);

  const peopleOptions = useMemo(() => 
    people.map(person => ({
      id: person.id,
      label: person.name,
      checked: initialFormData.selectedPersonIds.includes(person.id),
    })),
    [people, initialFormData.selectedPersonIds]
  );

  const crud = useEntityCRUD({
    entityType: 'budget',
    initialFormData,
    validator: (data) => validateBudgetForm({
      description: data.name,
      amount: data.amount.toString(),
      selectedCategories: [data.category],
    }),
    createFn: addBudget,
    updateFn: async (id: string, data: any) => {
      await updateBudget({ id, ...data });
      return { id, ...data };
    },
    mapFormToEntity: (formData) => ({
      description: formData.name.trim(),
      amount: Number(formData.amount),
      categories: [formData.category],
      personId: formData.selectedPersonIds[0], // Budget has single personId
      period: 'monthly' as const,
    }),
  });

  const handlePersonToggle = useCallback((personId: string, checked: boolean) => {
    const currentIds = crud.data.selectedPersonIds;
    const newSelectedIds = checked
      ? [...currentIds, personId]
      : currentIds.filter(id => id !== personId);

    crud.updateField("selectedPersonIds", newSelectedIds);
  }, [crud]);

  return {
    ...crud,
    peopleOptions,
    handlePersonToggle,
  };
};

/**
 * Hook specifico per Person
 */
export const usePersonManagement = (existingPerson?: any) => {
  const { addPerson, updatePerson } = useFinance();

  const initialFormData = useMemo(() => ({
    name: existingPerson?.name || "",
    avatar: existingPerson?.avatar || "",
  }), [existingPerson]);

  const crud = useEntityCRUD({
    entityType: 'person',
    initialFormData,
    validator: validatePersonForm,
    createFn: async (data: any) => {
      // addPerson expects different signature
      await addPerson(data);
      return data;
    },
    updateFn: async (id: string, data: any) => {
      await updatePerson({ id, ...data });
      return { id, ...data };
    },
    mapFormToEntity: (formData) => ({
      name: formData.name.trim(),
      avatar: formData.avatar,
    }),
  });

  return crud;
};
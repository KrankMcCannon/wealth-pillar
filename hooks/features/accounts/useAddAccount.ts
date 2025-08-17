import React, { useCallback, useMemo } from "react";
import { useFinance, useModalForm } from "../../";
import { validateAccountForm } from "../../utils/validators";

interface AccountFormData {
  name: string;
  type: "stipendio" | "risparmio" | "contanti" | "investimenti";
  selectedPersonIds: string[];
}

interface UseAddAccountProps {
  onClose: () => void;
}

/**
 * Hook per gestire la logica di aggiunta account
 * Estrae tutta la business logic dal componente UI
 */
export const useAddAccount = ({ onClose }: UseAddAccountProps) => {
  const { addAccount, people } = useFinance();

  const initialFormData: AccountFormData = useMemo(
    () => ({
      name: "",
      type: "stipendio",
      selectedPersonIds: [],
    }),
    []
  );

  const { data, errors, isSubmitting, updateField, setError, clearAllErrors, setSubmitting, resetForm } = useModalForm({
    initialData: initialFormData,
    resetOnClose: true,
    resetOnOpen: true,
  });

  const accountTypeOptions = useMemo(
    () => [
      { value: "stipendio", label: "Stipendio" },
      { value: "risparmi", label: "Risparmi" },
      { value: "contanti", label: "Contanti" },
      { value: "investimenti", label: "Investimenti" },
    ],
    []
  );

  const peopleOptions = useMemo(
    () =>
      people.map((person) => ({
        id: person.id,
        label: person.name,
        checked: data.selectedPersonIds.includes(person.id),
      })),
    [people, data.selectedPersonIds]
  );

  const validateForm = useCallback((): boolean => {
    clearAllErrors();
    const errorsObj = validateAccountForm({
      name: data.name,
      selectedPersonIds: data.selectedPersonIds,
    });
    Object.entries(errorsObj).forEach(([field, message]) => {
      setError(field as any, message as string);
    });
    return Object.keys(errorsObj).length === 0;
  }, [data, clearAllErrors, setError]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setSubmitting(true);

      try {
        await addAccount({
          name: data.name.trim(),
          type: data.type,
          personIds: data.selectedPersonIds,
          balance: 0,
          groupId: null,
        });
        onClose();
      } catch (err) {
        setError("general", err instanceof Error ? err.message : "Errore durante l'aggiunta del conto");
      } finally {
        setSubmitting(false);
      }
    },
    [validateForm, setSubmitting, data, addAccount, onClose, setError]
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField("name", e.target.value);
    },
    [updateField]
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateField("type", e.target.value);
    },
    [updateField]
  );

  const handlePersonToggle = useCallback(
    (personId: string, checked: boolean) => {
      const newSelectedIds = checked
        ? [...data.selectedPersonIds, personId]
        : data.selectedPersonIds.filter((id) => id !== personId);

      updateField("selectedPersonIds", newSelectedIds);
    },
    [data.selectedPersonIds, updateField]
  );

  const handleReset = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const canSubmit = useMemo(() => {
    return (
      Object.keys(
        validateAccountForm({
          name: data.name,
          selectedPersonIds: data.selectedPersonIds,
        })
      ).length === 0
    );
  }, [data]);

  return {
    // Form state
    data,
    errors,
    isSubmitting,
    canSubmit,

    // Computed values
    accountTypeOptions,
    peopleOptions,

    // Event handlers
    handleSubmit,
    handleNameChange,
    handleTypeChange,
    handlePersonToggle,
    handleReset,
  };
};

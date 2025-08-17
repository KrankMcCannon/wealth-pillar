import { useCallback } from "react";
import { useOnboardingForm, OnboardingValidators, type ValidationRule } from "./useOnboardingForm";
import type { OnboardingGroup } from "../../../types";

/**
 * Hook specifico per il form di creazione gruppo
 * Principio SRP: Si occupa solo della validazione e gestione del form gruppo
 * Principio DRY: Usa il framework generico di form
 */
export const useOnboardingGroupForm = (initialData?: Partial<OnboardingGroup>) => {
  const initialGroup: OnboardingGroup = {
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
  };

  // Regole di validazione specifiche per il gruppo
  const validationRules: ValidationRule<OnboardingGroup>[] = [
    {
      field: "name",
      validator: OnboardingValidators.required("Nome gruppo"),
    },
    {
      field: "name",
      validator: OnboardingValidators.minLength("Nome gruppo", 2),
    },
  ];

  const {
    data: groupData,
    errors: validationErrors,
    isValid,
    isDirty,
    updateField,
    validateForm,
    resetForm,
    clearErrors,
  } = useOnboardingForm({
    initialData: initialGroup,
    validationRules,
    customValidation: (data) => {
      const errors: Record<string, string> = {};

      // Validazione personalizzata se necessaria
      if (data.name && data.name.trim().length > 50) {
        errors.name = "Il nome del gruppo non può superare i 50 caratteri";
      }

      if (data.description && data.description.trim().length > 200) {
        errors.description = "La descrizione non può superare i 200 caratteri";
      }

      return errors;
    },
  });

  /**
   * Handler per il cambio di campo ottimizzato per input
   */
  const handleFieldChange = useCallback(
    (field: keyof OnboardingGroup) => (e: React.ChangeEvent<HTMLInputElement>) => {
      updateField(field, e.target.value);
    },
    [updateField]
  );

  /**
   * Validazione completa e controllo se il form può essere sottomesso
   */
  const canSubmit = isValid && groupData.name.trim().length > 0;

  return {
    groupData,
    validationErrors,
    isValid,
    isDirty,
    canSubmit,
    handleFieldChange,
    validateForm,
    resetForm,
    clearErrors,
  };
};

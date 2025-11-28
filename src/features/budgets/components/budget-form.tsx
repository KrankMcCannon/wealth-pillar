"use client";

import { useState, useEffect, useMemo } from "react";
import { Budget, BudgetType, Category } from "@/lib/types";
import { CreateBudgetInput } from "@/lib/services/budget.service";
import { createBudgetAction, updateBudgetAction } from "@/features/budgets/actions/budget-actions";
import {
  FormActions,
  FormCheckboxGroup,
  FormField,
  FormSelect,
} from "@/src/components/form";
import {
  AmountField,
  Input,
  ModalContent,
  ModalSection,
  ModalWrapper,
  UserField,
} from "@/src/components/ui";

interface BudgetFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget; // For editing existing budgets
  mode?: "create" | "edit";
  selectedUserId?: string; // Pre-selected user from page filter
  categories?: Category[];
  groupUsers?: Array<{ id: string; name: string }>; // For user selection
  onSuccess?: (budget: Budget, action: "create" | "update") => void;
}

interface FormData {
  description: string;
  amount: string;
  type: BudgetType;
  icon?: string;
  categories: string[];
  user_id: string;
}

interface FormErrors {
  description?: string;
  amount?: string;
  type?: string;
  categories?: string;
  user_id?: string;
  submit?: string;
}

export function BudgetForm({
  isOpen,
  onOpenChange,
  budget,
  mode = "create",
  selectedUserId,
  categories = [],
  groupUsers = [],
  onSuccess,
}: Readonly<BudgetFormProps>) {
  const title = mode === "edit" ? "Modifica Budget" : "Nuovo Budget";
  const description = mode === "edit" ? "Aggiorna i dettagli del budget" : "Crea un nuovo budget";

  // Initialize form data
  const [formData, setFormData] = useState<FormData>({
    description: "",
    amount: "",
    type: "monthly",
    icon: undefined,
    categories: [],
    user_id: selectedUserId || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert categories to checkbox options
  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.id,
      label: category.label,
      color: category.color,
    }));
  }, [categories]);

  // Reset form when modal opens/closes or budget changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && budget) {
        // Populate form with existing budget data
        setFormData({
          description: budget.description,
          amount: budget.amount.toString(),
          type: budget.type,
          icon: budget.icon,
          categories: budget.categories,
          user_id: budget.user_id,
        });
      } else {
        // Reset to defaults for create mode
        setFormData({
          description: "",
          amount: "",
          type: "monthly",
          icon: undefined,
          categories: [],
          user_id: selectedUserId || "",
        });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, mode, budget, selectedUserId]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "La descrizione è obbligatoria";
    } else if (formData.description.trim().length < 2) {
      newErrors.description = "La descrizione deve contenere almeno 2 caratteri";
    }

    // Amount validation
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount)) {
      newErrors.amount = "L'importo è obbligatorio";
    } else if (amount <= 0) {
      newErrors.amount = "L'importo deve essere maggiore di zero";
    }

    // Type validation
    if (!formData.type) {
      newErrors.type = "Il tipo è obbligatorio";
    }

    // Categories validation
    if (formData.categories.length === 0) {
      newErrors.categories = "Seleziona almeno una categoria";
    }

    // User validation
    if (!formData.user_id) {
      newErrors.user_id = "L'utente è obbligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault?.();
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const amount = parseFloat(formData.amount);

      if (mode === "create") {
        // Create new budget
        const input: CreateBudgetInput = {
          description: formData.description.trim(),
          amount,
          type: formData.type,
          icon: formData.icon,
          categories: formData.categories,
          user_id: formData.user_id,
        };

        const result = await createBudgetAction(input);

        if (result.error || !result.data) {
          setErrors({ submit: result.error || "Errore durante la creazione" });
          return;
        }

        // Call success callback for optimistic UI update
        onSuccess?.(result.data, "create");
        onOpenChange(false);
      } else {
        // Update existing budget
        if (!budget) {
          setErrors({ submit: "Budget non trovato" });
          return;
        }

        const result = await updateBudgetAction(budget.id, {
          description: formData.description.trim(),
          amount,
          type: formData.type,
          icon: formData.icon,
          categories: formData.categories,
          user_id: formData.user_id,
        });

        if (result.error || !result.data) {
          setErrors({
            submit: result.error || "Errore durante l'aggiornamento",
          });
          return;
        }

        // Call success callback for optimistic UI update
        onSuccess?.(result.data, "update");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("[BudgetForm] Submit error:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Errore sconosciuto",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle field changes
  const handleChange = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field (only for fields that can have errors)
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        maxWidth="md"
        footer={
          <FormActions
            submitType="button"
            submitLabel={mode === "edit" ? "Salva" : "Crea Budget"}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ModalContent className="gap-2">
          {/* Submit error message */}
          {errors.submit && (
            <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
              {errors.submit}
            </div>
          )}

          <ModalSection className="gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Utente (if not pre-selected) */}
              {!selectedUserId && groupUsers && groupUsers.length > 0 && (
                <UserField
                  value={formData.user_id}
                  onChange={(value) => handleChange("user_id", value)}
                  error={errors.user_id}
                  required
                />
              )}

              {/* Tipo */}
              <FormField label="Tipo budget" required error={errors.type}>
                <FormSelect
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value as BudgetType)}
                  options={[
                    { value: "monthly", label: "Mensile" },
                    { value: "annually", label: "Annuale" },
                  ]}
                />
              </FormField>

              {/* Importo */}
              <AmountField
                value={parseFloat(formData.amount) || 0}
                onChange={(value) => handleChange("amount", value.toString())}
                error={errors.amount}
                required
              />
            </div>
          </ModalSection>

          <ModalSection className="gap-2">
            {/* Descrizione */}
            <FormField label="Descrizione" required error={errors.description}>
              <Input
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="es. Spese mensili"
              />
            </FormField>
          </ModalSection>

          <ModalSection className="gap-1 shrink-0">
            <FormField label="Seleziona categorie" required error={errors.categories} className="space-y-1">
              <FormCheckboxGroup
                value={formData.categories}
                onChange={(value) => handleChange("categories", value)}
                options={categoryOptions}
                showSearch
                showSelectAll
                maxHeight="200px"
              />
            </FormField>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </form>
  );
}

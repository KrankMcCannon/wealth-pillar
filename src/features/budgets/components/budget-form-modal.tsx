"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Budget, BudgetType } from "@/lib/types";
import { createBudgetAction, updateBudgetAction } from "@/features/budgets/actions/budget-actions";
import { ModalWrapper, ModalContent, ModalSection } from "@/src/components/ui/modal-wrapper";
import { FormActions, FormField, FormSelect } from "@/src/components/form";
import { AmountField, Checkbox, Input, UserField } from "@/src/components/ui";
import { usePermissions, useRequiredCurrentUser, useRequiredGroupUsers, useRequiredGroupId } from "@/hooks";
import { useCategories } from "@/stores/reference-data-store";
import { useUserFilterStore } from "@/stores/user-filter-store";
import { usePageDataStore } from "@/stores/page-data-store";

// Zod schema for budget validation
const budgetSchema = z.object({
  description: z.string()
    .min(2, "La descrizione deve contenere almeno 2 caratteri")
    .trim(),
  amount: z.string()
    .min(1, "L'importo è obbligatorio")
    .refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0, {
      message: "L'importo deve essere maggiore di zero"
    }),
  type: z.enum(["monthly", "annually"]),
  icon: z.string().nullable().optional(),
  categories: z.array(z.string()).min(1, "Seleziona almeno una categoria"),
  user_id: z.string().min(1, "L'utente è obbligatorio"),
  categorySearch: z.string().optional(),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function BudgetFormModal({
  isOpen,
  onClose,
  editId,
}: Readonly<BudgetFormModalProps>) {
  // Read from stores instead of props
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const categories = useCategories();
  const groupId = useRequiredGroupId();
  const selectedUserId = useUserFilterStore(state => state.selectedUserId);

  // Page data store actions for optimistic updates
  const storeBudgets = usePageDataStore((state) => state.budgets);
  const addBudget = usePageDataStore((state) => state.addBudget);
  const updateBudget = usePageDataStore((state) => state.updateBudget);
  const removeBudget = usePageDataStore((state) => state.removeBudget);

  const isEditMode = !!editId;
  const title = isEditMode ? "Modifica Budget" : "Nuovo Budget";
  const description = isEditMode ? "Aggiorna i dettagli del budget" : "Crea un nuovo budget";

  // Permission checks
  const { shouldDisableUserField, defaultFormUserId, userFieldHelperText } = usePermissions({
    currentUser,
    selectedUserId,
  });

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      description: "",
      amount: "",
      type: "monthly",
      icon: null,
      categories: [],
      user_id: defaultFormUserId,
      categorySearch: "",
    }
  });

  const watchedType = watch("type");
  const watchedCategories = watch("categories");
  const watchedUserId = watch("user_id");
  const categorySearch = watch("categorySearch") || "";

  // Convert categories to checkbox options
  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.key,
      label: category.label,
      color: category.color,
    }));
  }, [categories]);

  const filteredCategoryOptions = useMemo(() => {
    if (!categorySearch.trim()) {
      return categoryOptions;
    }

    const query = categorySearch.trim().toLowerCase();
    return categoryOptions.filter((option) => option.label.toLowerCase().includes(query));
  }, [categoryOptions, categorySearch]);

  // Load budget data for edit mode
  useEffect(() => {
    if (isOpen && isEditMode && editId) {
      // Find budget in store
      const budget = storeBudgets.find((b) => b.id === editId);

      if (budget) {
        reset({
          description: budget.description,
          amount: budget.amount.toString(),
          type: budget.type,
          icon: budget.icon,
          categories: budget.categories,
          user_id: budget.user_id,
          categorySearch: "",
        });
      }
    } else if (isOpen && !isEditMode) {
      // Reset to defaults for create mode
      reset({
        description: "",
        amount: "",
        type: "monthly",
        icon: null,
        categories: [],
        user_id: defaultFormUserId,
        categorySearch: "",
      });
    }
  }, [isOpen, isEditMode, editId, defaultFormUserId, reset, storeBudgets]);

  // Handle category toggle
  const handleCategoryToggle = (categoryId: string, checked: CheckedState) => {
    const isChecked = checked === true || checked === "indeterminate";
    const currentCategories = watchedCategories || [];
    const updatedCategories = isChecked
      ? Array.from(new Set([...currentCategories, categoryId]))
      : currentCategories.filter((id) => id !== categoryId);

    setValue("categories", updatedCategories);
  };

  // Select all categories
  const handleSelectAllCategories = () => {
    if (!categoryOptions.length) return;
    setValue("categories", categoryOptions.map((option) => option.value));
  };

  // Clear all categories
  const handleClearCategories = () => {
    setValue("categories", []);
  };

  // Handle form submission with optimistic updates
  const onSubmit = async (data: BudgetFormData) => {
    try {
      const amount = Number.parseFloat(data.amount);
      const budgetData = {
        description: data.description.trim(),
        amount,
        type: data.type as BudgetType,
        icon: data.icon ?? null,
        categories: data.categories,
        user_id: data.user_id,
        group_id: groupId,
      };

      if (isEditMode && editId) {
        // UPDATE: Optimistic update pattern
        // 1. Store original budget for revert
        const originalBudget = storeBudgets.find((b) => b.id === editId);
        if (!originalBudget) {
          setError("root", { message: "Budget non trovato" });
          return;
        }

        // 2. Update in store immediately (optimistic)
        updateBudget(editId, budgetData);

        // 3. Call server action
        const result = await updateBudgetAction(editId, budgetData);

        if (result.error) {
          // 4. Revert on error
          updateBudget(editId, originalBudget);
          setError("root", { message: result.error });
          return;
        }

        // 5. Success - update with real data from server
        if (result.data) {
          updateBudget(editId, result.data);
        }
      } else {
        // CREATE: Optimistic add pattern
        // 1. Create temporary ID
        const tempId = `temp-${Date.now()}`;
        const now = new Date().toISOString();
        const optimisticBudget: Budget = {
          id: tempId,
          created_at: now,
          updated_at: now,
          ...budgetData,
        };

        // 2. Add to store immediately (optimistic)
        addBudget(optimisticBudget);

        // 3. Close modal immediately for better UX
        onClose();

        // 4. Call server action in background
        const result = await createBudgetAction(budgetData);

        if (result.error) {
          // 5. Remove optimistic budget on error
          removeBudget(tempId);
          console.error("Failed to create budget:", result.error);
          return;
        }

        // 6. Replace temporary with real budget from server
        removeBudget(tempId);
        if (result.data) {
          addBudget(result.data);
        }
        return; // Early return since modal already closed
      }

      // Close modal on success (for update mode)
      onClose();
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Errore sconosciuto"
      });
    }
  };

  return (
    <form className="space-y-2">
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={onClose}
        title={title}
        description={description}
        maxWidth="md"
        footer={
          <FormActions
            submitType="button"
            submitLabel={isEditMode ? "Salva" : "Crea Budget"}
            onSubmit={handleSubmit(onSubmit)}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ModalContent className="gap-2">
          {/* Submit Error Display */}
          {errors.root && (
            <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
              {errors.root.message}
            </div>
          )}

          <ModalSection className="gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* User */}
              <UserField
                value={watchedUserId}
                onChange={(value) => setValue("user_id", value)}
                error={errors.user_id?.message}
                users={groupUsers}
                label="Utente"
                placeholder="Seleziona utente"
                disabled={shouldDisableUserField}
                helperText={userFieldHelperText}
                required
              />

              {/* Type */}
              <FormField label="Tipo budget" required error={errors.type?.message}>
                <FormSelect
                  value={watchedType}
                  onValueChange={(value) => setValue("type", value as BudgetType)}
                  options={[
                    { value: "monthly", label: "Mensile" },
                    { value: "annually", label: "Annuale" },
                  ]}
                />
              </FormField>

              {/* Amount */}
              <AmountField
                value={Number.parseFloat(watch("amount") || "0")}
                onChange={(value) => setValue("amount", value.toString())}
                error={errors.amount?.message}
                label="Importo"
                placeholder="0,00"
                required
              />
            </div>
          </ModalSection>

          <ModalSection className="gap-2">
            {/* Description */}
            <FormField label="Descrizione" required error={errors.description?.message}>
              <Input
                {...register("description")}
                placeholder="es. Spese mensili"
                disabled={isSubmitting}
              />
            </FormField>
          </ModalSection>

          <ModalSection className="gap-1 shrink-0">
            {/* Categories Selection */}
            <FormField label="Seleziona categorie" required error={errors.categories?.message} className="space-y-1">
              <div className="space-y-3 rounded-2xl border border-primary/15 bg-card/70 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Input
                    value={categorySearch}
                    onChange={(event) => setValue("categorySearch", event.target.value)}
                    placeholder="Cerca categoria..."
                    className="h-9 text-sm"
                  />
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium">
                      {watchedCategories.length}/{categoryOptions.length} selezionate
                    </span>
                    <button
                      type="button"
                      className="text-primary hover:underline disabled:opacity-40"
                      onClick={handleSelectAllCategories}
                      disabled={!categoryOptions.length}
                    >
                      Seleziona tutto
                    </button>
                    <button
                      type="button"
                      className="text-primary hover:underline disabled:opacity-40"
                      onClick={handleClearCategories}
                      disabled={!watchedCategories.length}
                    >
                      Pulisci
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {filteredCategoryOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-1 py-4">Nessuna categoria trovata</p>
                  ) : (
                    filteredCategoryOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 rounded-xl border border-primary/10 bg-card/80 px-3 py-2 text-sm hover:border-primary/40 cursor-pointer"
                      >
                        <Checkbox
                          checked={watchedCategories.includes(option.value)}
                          onCheckedChange={(checked) => handleCategoryToggle(option.value, checked)}
                        />
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: option.color || "#CBD5F5" }}
                          />
                          {option.label}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </FormField>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </form>
  );
}

// Default export for lazy loading
export default BudgetFormModal;

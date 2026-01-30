"use client";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Budget, BudgetType } from "@/lib/types";
import { getTempId } from "@/lib/utils/temp-id";
import { createBudgetAction, updateBudgetAction } from "@/features/budgets";
import { ModalWrapper, ModalBody, ModalFooter, ModalSection } from "@/components/ui/modal-wrapper";
import { FormActions, FormField, FormSelect } from "@/components/form";
import { AmountField, Checkbox, Input, UserField } from "@/components/ui";
import { usePermissions, useRequiredCurrentUser, useRequiredGroupUsers, useRequiredGroupId } from "@/hooks";
import { useCategories } from "@/stores/reference-data-store";
import { useUserFilterStore } from "@/stores/user-filter-store";
import { usePageDataStore } from "@/stores/page-data-store";
import { budgetStyles, getBudgetCategoryColorStyle } from "@/styles/system";

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
    control,
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

  const watchedType = useWatch({ control, name: "type" });
  const watchedCategories = useWatch({ control, name: "categories" });
  const watchedUserId = useWatch({ control, name: "user_id" });
  const watchedAmount = useWatch({ control, name: "amount" });
  const categorySearch = useWatch({ control, name: "categorySearch" }) || "";

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

  // Handle update budget flow
  const handleUpdate = async (data: BudgetFormData, id: string) => {
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

    // 1. Store original budget for revert
    const originalBudget = storeBudgets.find((b) => b.id === id);
    if (!originalBudget) {
      throw new Error("Budget non trovato");
    }

    // 2. Update in store immediately (optimistic)
    updateBudget(id, budgetData);

    // 3. Call server action
    const result = await updateBudgetAction(id, budgetData);

    if (result.error) {
      // 4. Revert on error
      updateBudget(id, originalBudget);
      throw new Error(result.error);
    }

    // 5. Success - update with real data from server
    if (result.data) {
      updateBudget(id, result.data);
    }
  };

  // Handle create budget flow
  const handleCreate = async (data: BudgetFormData) => {
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

    // 1. Create temporary ID
    const tempId = getTempId("temp-budget");
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
  };

  // Handle form submission with optimistic updates
  const onSubmit = async (data: BudgetFormData) => {
    try {
      if (isEditMode && editId) {
        await handleUpdate(data, editId);
        onClose(); // Close on success for update
      } else {
        await handleCreate(data);
        // onClose is called inside handleCreate for immediate feedback
      }
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Errore sconosciuto"
      });
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onClose}
      title={title}
      description={description}
      maxWidth="md"
      repositionInputs={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={cn(budgetStyles.formModal.form, "flex flex-col h-full")}>
        <ModalBody className={budgetStyles.formModal.content}>
          {/* Submit Error Display */}
          {errors.root && (
            <div className={budgetStyles.formModal.error}>
              {errors.root.message}
            </div>
          )}

          <ModalSection className={budgetStyles.formModal.section}>
            <div className={budgetStyles.formModal.grid}>
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
                value={Number.parseFloat(watchedAmount || "0")}
                onChange={(value) => setValue("amount", value.toString())}
                error={errors.amount?.message}
                label="Importo"
                placeholder="0,00"
                required
              />
            </div>
          </ModalSection>

          <ModalSection className={budgetStyles.formModal.section}>
            {/* Description */}
            <FormField label="Descrizione" required error={errors.description?.message}>
              <Input
                {...register("description")}
                placeholder="es. Spese mensili"
                disabled={isSubmitting}
              />
            </FormField>
          </ModalSection>

          <ModalSection className={budgetStyles.formModal.sectionTight}>
            {/* Categories Selection */}
            <FormField label="Seleziona categorie" required error={errors.categories?.message} className={budgetStyles.formModal.categoryField}>
              <div className={budgetStyles.formModal.categoryBox}>
                <div className={budgetStyles.formModal.categoryHeader}>
                  <Input
                    value={categorySearch}
                    onChange={(event) => setValue("categorySearch", event.target.value)}
                    placeholder="Cerca categoria..."
                    className={budgetStyles.formModal.categorySelect}
                  />
                  <div className={budgetStyles.formModal.categoryMeta}>
                    <span className={budgetStyles.formModal.categoryMetaStrong}>
                      {watchedCategories.length}/{categoryOptions.length} selezionate
                    </span>
                    <button
                      type="button"
                      className={budgetStyles.formModal.categoryLink}
                      onClick={handleSelectAllCategories}
                      disabled={!categoryOptions.length}
                    >
                      Seleziona tutto
                    </button>
                    <button
                      type="button"
                      className={budgetStyles.formModal.categoryLink}
                      onClick={handleClearCategories}
                      disabled={!watchedCategories.length}
                    >
                      Pulisci
                    </button>
                  </div>
                </div>

                <div className={budgetStyles.formModal.categoryList}>
                  {filteredCategoryOptions.length === 0 ? (
                    <p className={budgetStyles.formModal.categoryEmpty}>Nessuna categoria trovata</p>
                  ) : (
                    filteredCategoryOptions.map((option) => (
                      <label
                        key={option.value}
                        className={budgetStyles.formModal.categoryItem}
                      >
                        <Checkbox
                          checked={watchedCategories.includes(option.value)}
                          onCheckedChange={(checked) => handleCategoryToggle(option.value, checked)}
                        />
                        <span className={budgetStyles.formModal.categoryItemRow}>
                          <span
                            className={budgetStyles.formModal.categoryDot}
                            style={getBudgetCategoryColorStyle(option.color)}
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
        </ModalBody>

        <ModalFooter>
          <FormActions
            submitType="submit"
            submitLabel={isEditMode ? "Salva" : "Crea Budget"}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            className="w-full sm:w-auto"
          />
        </ModalFooter>
      </form>
    </ModalWrapper>
  );
}

// Default export for lazy loading
export default BudgetFormModal;

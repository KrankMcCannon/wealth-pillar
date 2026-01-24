"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Category, cn } from "@/lib";
import { getTempId } from "@/lib/utils/temp-id";
import { FinanceLogicService } from "@/server/services/finance-logic.service";
import { categoryStyles, getCategoryColorStyle } from "../theme/category-styles";
import { createCategoryAction, updateCategoryAction } from "@/features/categories";
import { ModalWrapper, ModalBody, ModalFooter, ModalSection } from "@/components/ui/modal-wrapper";
import { FormActions, FormField } from "@/components/form";
import { IconPicker, Input } from "@/components/ui";
import { useRequiredGroupId } from "@/hooks";
import { useCategories, useReferenceDataStore } from "@/stores/reference-data-store";

// Zod schema for category validation
const categorySchema = z.object({
  label: z.string()
    .min(1, "L'etichetta è obbligatoria")
    .trim(),
  key: z.string()
    .min(1, "La chiave è obbligatoria")
    .trim(),
  icon: z.string()
    .min(1, "L'icona è obbligatoria")
    .trim(),
  color: z.string()
    .min(1, "Il colore è obbligatorio")
    .trim()
    .refine((val) => FinanceLogicService.isValidColor(val), {
      message: "Formato colore non valido. Usa il formato esadecimale (es. #FF0000)"
    }),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function CategoryFormModal({
  isOpen,
  onClose,
  editId,
}: Readonly<CategoryFormModalProps>) {
  // Read from store instead of props
  const groupId = useRequiredGroupId();

  // Reference data store actions for optimistic updates
  const storeCategories = useCategories();
  const addCategory = useReferenceDataStore((state) => state.addCategory);
  const updateCategory = useReferenceDataStore((state) => state.updateCategory);
  const removeCategory = useReferenceDataStore((state) => state.removeCategory);

  const isEditMode = !!editId;
  const title = isEditMode ? "Modifica Categoria" : "Nuova Categoria";
  const description = isEditMode ? "Aggiorna i dettagli della categoria" : "Crea una nuova categoria";

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      label: "",
      key: "",
      icon: "",
      color: FinanceLogicService.getDefaultColor(),
    }
  });

  const watchedLabel = useWatch({ control, name: "label" });
  const watchedColor = useWatch({ control, name: "color" });
  const watchedIcon = useWatch({ control, name: "icon" });

  // Get color palette from CategoryService
  const colorPalette = useMemo(() => FinanceLogicService.getColorPalette(), []);

  // Load category data for edit mode
  useEffect(() => {
    if (isOpen && isEditMode && editId) {
      // Find category in store
      const category = storeCategories.find((cat) => cat.id === editId);

      if (category) {
        reset({
          label: category.label,
          key: category.key,
          icon: category.icon,
          color: category.color,
        });
      }
    } else if (isOpen && !isEditMode) {
      // Reset to defaults for create mode
      reset({
        label: "",
        key: "",
        icon: "",
        color: FinanceLogicService.getDefaultColor(),
      });
    }
  }, [isOpen, isEditMode, editId, reset, storeCategories]);

  // Auto-generate key from label (only in create mode)
  useEffect(() => {
    if (!isEditMode && watchedLabel) {
      const generatedKey = watchedLabel
        .toLowerCase()
        .trim()
        .replaceAll(/[^a-z0-9]+/g, "_")
        .replaceAll(/^_+|_+$/g, "");
      setValue("key", generatedKey);
    }
  }, [watchedLabel, isEditMode, setValue]);

  // Handle form submission with optimistic updates
  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditMode && editId) {
        // UPDATE: Optimistic update pattern
        // 1. Store original category for revert
        const originalCategory = storeCategories.find((cat) => cat.id === editId);
        if (!originalCategory) {
          setError("root", { message: "Categoria non trovata" });
          return;
        }

        const updateData = {
          label: data.label.trim(),
          icon: data.icon.trim(),
          color: data.color.trim().toUpperCase(),
        };

        // 2. Update in store immediately (optimistic)
        updateCategory(editId, updateData);

        // 3. Call server action
        const result = await updateCategoryAction(editId, updateData);

        if (result.error) {
          // 4. Revert on error
          updateCategory(editId, originalCategory);
          setError("root", { message: result.error });
          return;
        }

        // 5. Success - update with real data from server
        if (result.data) {
          updateCategory(editId, result.data);
        }
      } else {
        // CREATE: Optimistic add pattern
        // 1. Create temporary ID
        const tempId = getTempId("temp-category");
        const now = new Date().toISOString();
        const optimisticCategory: Category = {
          id: tempId,
          created_at: now,
          updated_at: now,
          label: data.label.trim(),
          key: data.key.trim(),
          icon: data.icon.trim(),
          color: data.color.trim().toUpperCase(),
          group_id: groupId,
        };

        // 2. Add to store immediately (optimistic)
        addCategory(optimisticCategory);

        // 3. Close modal immediately for better UX
        onClose();

        // 4. Call server action in background
        const result = await createCategoryAction({
          label: data.label.trim(),
          key: data.key.trim(),
          icon: data.icon.trim(),
          color: data.color.trim().toUpperCase(),
          group_id: groupId,
        });

        if (result.error) {
          // 5. Remove optimistic category on error
          removeCategory(tempId);
          console.error("Failed to create category:", result.error);
          return;
        }

        // 6. Replace temporary with real category from server
        removeCategory(tempId);
        if (result.data) {
          addCategory(result.data);
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
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onClose}
      title={title}
      description={description}
      maxWidth="md"
      repositionInputs={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={cn(categoryStyles.formModal.form, "flex flex-col h-full")}>
        <ModalBody>
          {/* Submit Error Display */}
          {errors.root && (
            <div className={categoryStyles.formModal.error}>
              {errors.root.message}
            </div>
          )}

          <ModalSection>
            {/* Label */}
            <FormField label="Etichetta" required error={errors.label?.message}>
              <Input
                {...register("label")}
                placeholder="es. Alimentari"
                disabled={isSubmitting}
              />
            </FormField>

            {/* Icon */}
            <FormField label="Icona" required error={errors.icon?.message}>
              <IconPicker
                value={watchedIcon}
                onChange={(value) => setValue("icon", value)}
              />
            </FormField>

            {/* Color */}
            <FormField label="Colore" required error={errors.color?.message}>
              <div className={categoryStyles.formModal.colorSection}>
                {/* Color palette */}
                <div className={categoryStyles.formModal.palette}>
                  {colorPalette.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setValue("color", color.value)}
                      disabled={isSubmitting}
                      className={cn(
                        categoryStyles.formModal.colorButton,
                        watchedColor.toUpperCase() === color.value.toUpperCase()
                          ? categoryStyles.formModal.colorActive
                          : categoryStyles.formModal.colorIdle,
                        isSubmitting && categoryStyles.formModal.colorDisabled
                      )}
                      style={getCategoryColorStyle(color.value)}
                      title={color.name}
                    >
                      {watchedColor.toUpperCase() === color.value.toUpperCase() && (
                        <div className={categoryStyles.formModal.checkWrap}>
                          <svg
                            className={categoryStyles.formModal.checkIcon}
                            fill="none"
                            strokeWidth="3"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom color input */}
                <Input
                  {...register("color")}
                  placeholder={FinanceLogicService.getDefaultColor()}
                  disabled={isSubmitting}
                />
              </div>
            </FormField>
          </ModalSection>
        </ModalBody>

        <ModalFooter>
          <FormActions
            submitType="submit"
            submitLabel={isEditMode ? "Salva" : "Crea Categoria"}
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
export default CategoryFormModal;

"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Category, cn } from "@/src/lib";
import { CategoryService } from "@/lib/services";
import { createCategoryAction, updateCategoryAction } from "@/features/categories/actions/category-actions";
import { ModalWrapper, ModalContent, ModalSection } from "@/src/components/ui/modal-wrapper";
import { FormActions, FormField } from "@/src/components/form";
import { IconPicker, Input } from "@/src/components/ui";

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
    .refine((val) => CategoryService.isValidColor(val), {
      message: "Formato colore non valido. Usa il formato esadecimale (es. #FF0000)"
    }),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
  groupId: string;
}

function CategoryFormModal({
  isOpen,
  onClose,
  editId,
  groupId
}: CategoryFormModalProps) {
  const isEditMode = !!editId;
  const title = isEditMode ? "Modifica Categoria" : "Nuova Categoria";
  const description = isEditMode ? "Aggiorna i dettagli della categoria" : "Crea una nuova categoria";

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
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
      color: CategoryService.getDefaultColor(),
    }
  });

  const watchedLabel = watch("label");
  const watchedColor = watch("color");
  const watchedIcon = watch("icon");

  // Get color palette from CategoryService
  const colorPalette = useMemo(() => CategoryService.getColorPalette(), []);

  // Load category data for edit mode
  useEffect(() => {
    if (isOpen && isEditMode && editId) {
      // TODO: Fetch category by editId
      // For now, reset to defaults
      reset({
        label: "",
        key: "",
        icon: "",
        color: CategoryService.getDefaultColor(),
      });
    } else if (isOpen && !isEditMode) {
      // Reset to defaults for create mode
      reset({
        label: "",
        key: "",
        icon: "",
        color: CategoryService.getDefaultColor(),
      });
    }
  }, [isOpen, isEditMode, editId, reset]);

  // Auto-generate key from label (only in create mode)
  useEffect(() => {
    if (!isEditMode && watchedLabel) {
      const generatedKey = watchedLabel
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("key", generatedKey);
    }
  }, [watchedLabel, isEditMode, setValue]);

  // Handle form submission
  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditMode && editId) {
        // Update existing category
        const result = await updateCategoryAction(editId, {
          label: data.label.trim(),
          icon: data.icon.trim(),
          color: data.color.trim().toUpperCase(),
        });

        if (result.error) {
          setError("root", { message: result.error });
          return;
        }
      } else {
        // Create new category
        const result = await createCategoryAction({
          label: data.label.trim(),
          key: data.key.trim(),
          icon: data.icon.trim(),
          color: data.color.trim().toUpperCase(),
          group_id: groupId,
        });

        if (result.error) {
          setError("root", { message: result.error });
          return;
        }
      }

      // Close modal on success
      onClose();
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Errore sconosciuto"
      });
    }
  };

  return (
    <form className="space-y-4">
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={onClose}
        title={title}
        description={description}
        maxWidth="md"
        footer={
          <FormActions
            submitType="button"
            submitLabel={isEditMode ? "Salva" : "Crea Categoria"}
            onSubmit={handleSubmit(onSubmit)}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ModalContent>
          {/* Submit Error Display */}
          {errors.root && (
            <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
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
              <div className="space-y-3">
                {/* Color palette */}
                <div className="grid grid-cols-8 gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setValue("color", color.value)}
                      disabled={isSubmitting}
                      className={cn(
                        "group relative aspect-square rounded-lg transition-all duration-200",
                        watchedColor.toUpperCase() === color.value.toUpperCase()
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                          : "hover:scale-105 hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background",
                        isSubmitting && "opacity-50 cursor-not-allowed"
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {watchedColor.toUpperCase() === color.value.toUpperCase() && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="h-4 w-4 text-white drop-shadow-lg"
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
                  placeholder={CategoryService.getDefaultColor()}
                  disabled={isSubmitting}
                />
              </div>
            </FormField>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </form>
  );
}

// Default export for lazy loading
export default CategoryFormModal;

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Category, cn } from "@/src/lib";
import { CategoryService } from "@/lib/services";
import { createCategoryAction, updateCategoryAction } from "@/features/categories/actions/category-actions";
import { FormActions, FormField } from "@/src/components/form";
import { IconPicker, Input, ModalContent, ModalSection, ModalWrapper } from "@/src/components/ui";

interface CategoryFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  mode?: "create" | "edit";
  groupId?: string; // For creating new categories
  onSuccess?: (category: Category, action: "create" | "update") => void;
}

interface FormData {
  label: string;
  key: string;
  icon: string;
  color: string;
}

interface FormErrors {
  label?: string;
  key?: string;
  icon?: string;
  color?: string;
  submit?: string;
}

export function CategoryForm({
  isOpen,
  onOpenChange,
  category,
  mode = "create",
  groupId,
  onSuccess,
}: Readonly<CategoryFormProps>) {
  const router = useRouter();
  const title = mode === "edit" ? "Modifica Categoria" : "Nuova Categoria";
  const description = mode === "edit" ? "Aggiorna i dettagli della categoria" : "Crea una nuova categoria";

  // Initialize form data
  const [formData, setFormData] = useState<FormData>({
    label: "",
    key: "",
    icon: "",
    color: CategoryService.getDefaultColor(),
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get color palette from CategoryService
  const colorPalette = useMemo(() => CategoryService.getColorPalette(), []);

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && category) {
        // Populate form with existing category data
        setFormData({
          label: category.label,
          key: category.key,
          icon: category.icon,
          color: category.color,
        });
      } else {
        // Reset to defaults for create mode
        setFormData({
          label: "",
          key: "",
          icon: "",
          color: CategoryService.getDefaultColor(),
        });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, mode, category]);

  // Auto-generate key from label
  useEffect(() => {
    if (mode === "create" && formData.label) {
      const generatedKey = formData.label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData((prev) => ({ ...prev, key: generatedKey }));
    }
  }, [formData.label, mode]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.label || formData.label.trim() === "") {
      newErrors.label = "L'etichetta è obbligatoria";
    }

    if (!formData.key || formData.key.trim() === "") {
      newErrors.key = "La chiave è obbligatoria";
    }

    if (!formData.icon || formData.icon.trim() === "") {
      newErrors.icon = "L'icona è obbligatoria";
    }

    if (!formData.color || formData.color.trim() === "") {
      newErrors.color = "Il colore è obbligatorio";
    } else if (!CategoryService.isValidColor(formData.color)) {
      newErrors.color = "Formato colore non valido. Usa il formato esadecimale (es. #FF0000)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field changes
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field if it exists
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle submit
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
      if (mode === "create") {
        // Create new category
        if (!groupId) {
          setErrors({ submit: "Group ID is required to create a category" });
          setIsSubmitting(false);
          return;
        }

        const result = await createCategoryAction({
          label: formData.label.trim(),
          key: formData.key.trim(),
          icon: formData.icon.trim(),
          color: formData.color.trim().toUpperCase(),
          group_id: groupId,
        });

        if (result.error || !result.data) {
          setErrors({ submit: result.error || "Failed to create category" });
          setIsSubmitting(false);
          return;
        }

        // Success callback
        if (onSuccess) {
          onSuccess(result.data, "create");
        }

        // Close modal
        onOpenChange(false);

        // Refresh page to show new category
        router.refresh();
      } else {
        // Update existing category
        if (!category) {
          setErrors({ submit: "Category is required for update" });
          setIsSubmitting(false);
          return;
        }

        const result = await updateCategoryAction(category.id, {
          label: formData.label.trim(),
          icon: formData.icon.trim(),
          color: formData.color.trim().toUpperCase(),
        });

        if (result.error || !result.data) {
          setErrors({ submit: result.error || "Failed to update category" });
          setIsSubmitting(false);
          return;
        }

        // Success callback
        if (onSuccess) {
          onSuccess(result.data, "update");
        }

        // Close modal
        onOpenChange(false);

        // Refresh page to show updated category
        router.refresh();
      }
    } catch (error) {
      console.error("[CategoryForm] Submit error:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "An unexpected error occurred",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        maxWidth="sm"
        footer={
          <FormActions
            submitType="button"
            submitLabel={mode === "edit" ? "Salva" : "Crea Categoria"}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ModalContent>
          {/* Submit error message */}
          {errors.submit && (
            <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
              {errors.submit}
            </div>
          )}

          <ModalSection>
            {/* Label */}
            <FormField label="Etichetta" required error={errors.label}>
              <Input
                value={formData.label}
                onChange={(e) => handleChange("label", e.target.value)}
                placeholder="es. Alimentari"
                disabled={isSubmitting}
              />
            </FormField>

            {/* Icon */}
            <FormField label="Icona" required error={errors.icon}>
              <IconPicker value={formData.icon} onChange={(value) => handleChange("icon", value)} />
            </FormField>

            {/* Color */}
            <FormField label="Colore" required error={errors.color}>
              <div className="space-y-3">
                {/* Color palette */}
                <div className="grid grid-cols-8 gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleChange("color", color.value)}
                      disabled={isSubmitting}
                      className={cn(
                        "group relative aspect-square rounded-lg transition-all duration-200",
                        formData.color.toUpperCase() === color.value.toUpperCase()
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                          : "hover:scale-105 hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background",
                        isSubmitting && "opacity-50 cursor-not-allowed"
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {formData.color.toUpperCase() === color.value.toUpperCase() && (
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
                  value={formData.color}
                  onChange={(e) => handleChange("color", e.target.value)}
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

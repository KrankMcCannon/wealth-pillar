"use client";

import { useMemo } from "react";
import { Category, cn } from "@/src/lib";
import { CategoryService } from "@/lib/services";
import {
  FormActions,
  FormField,
  IconPicker,
  Input,
  ModalContent,
  ModalSection,
  ModalWrapper,
} from "@/src/components/ui";

interface CategoryFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category; // For editing existing categories
  mode?: "create" | "edit";
}

export function CategoryForm({ isOpen, onOpenChange, mode = "create" }: Readonly<CategoryFormProps>) {
  const title = mode === "edit" ? "Modifica Categoria" : "Nuova Categoria";
  const description = mode === "edit" ? "Aggiorna i dettagli della categoria" : "Crea una nuova categoria";

  // Get color palette from CategoryService (avoids code duplication)
  const colorPalette = useMemo(() => CategoryService.getColorPalette(), []);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault?.();
    }
    // TODO: Implement submission logic using CategoryService.validateCategoryData()
    // Example:
    // const validation = CategoryService.validateCategoryData({ label, icon, color });
    // if (!validation.isValid) {
    //   setError(validation.error);
    //   return;
    // }
    // await createCategory({ label, icon, color });
    // onOpenChange(false);
  };

  return (
    <form className="space-y-4">
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
            isSubmitting={false}
          />
        }
      >
        <ModalContent>
          {false && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{false}</p>
            </div>
          )}
          <ModalSection>
            <FormField label="Etichetta" required error={""}>
              <Input value={""} onChange={() => {}} placeholder="es. Alimentari" />
            </FormField>

            <FormField label="Icona" required error={""}>
              <IconPicker value={""} onChange={() => {}} />
            </FormField>

            <FormField label="Colore" required error={""}>
              <div className="space-y-3">
                <div className="grid grid-cols-8 gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {}}
                      className={cn(
                        "group relative aspect-square rounded-lg transition-all duration-200",
                        false
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                          : "hover:scale-105 hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background"
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {false && (
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
                <Input
                  value={""}
                  onChange={() => {}}
                  placeholder={CategoryService.getDefaultColor()}
                />
              </div>
            </FormField>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </form>
  );
}

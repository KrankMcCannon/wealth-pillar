"use client";

import { Category, cn } from '@/src/lib';
import { useEffect } from 'react';
import useCategoryFormController from "../hooks/use-category-form-controller";
import { FormActions, FormField, IconPicker, Input, ModalContent, ModalSection, ModalWrapper } from '@/src/components/ui';

interface CategoryFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category; // For editing existing categories
  mode?: 'create' | 'edit';
}

// Predefined color palette for categories
const COLOR_PALETTE = [
  { name: 'Rosso', value: '#EF4444' },
  { name: 'Arancione', value: '#F97316' },
  { name: 'Ambra', value: '#F59E0B' },
  { name: 'Giallo', value: '#EAB308' },
  { name: 'Verde', value: '#22C55E' },
  { name: 'Smeraldo', value: '#10B981' },
  { name: 'Turchese', value: '#14B8A6' },
  { name: 'Ciano', value: '#06B6D4' },
  { name: 'Blu', value: '#3B82F6' },
  { name: 'Indaco', value: '#6366F1' },
  { name: 'Viola', value: '#8B5CF6' },
  { name: 'Porpora', value: '#A855F7' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Fucsia', value: '#D946EF' },
  { name: 'Grigio', value: '#6B7280' },
  { name: 'Ardesia', value: '#475569' },
];

export function CategoryForm({ isOpen, onOpenChange, category, mode = 'create' }: Readonly<CategoryFormProps>) {
  const controller = useCategoryFormController({ mode, initialCategory: category || null });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      controller.reset();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const title = mode === 'edit' ? 'Modifica Categoria' : 'Nuova Categoria';
  const description = mode === 'edit' ? 'Aggiorna i dettagli della categoria' : 'Crea una nuova categoria';

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault?.();
    }
    try {
      // submit() returns { hasErrors } synchronously for validation, throws if mutation fails
      const result = await controller.submit();
      // Only close modal if submission succeeded (no validation/mutation errors)
      if (!result.hasErrors && !controller.mutationError) {
        onOpenChange(false);
      }
    } catch (err) {
      // Error is captured in controller.mutationError and will be displayed to user
      // Don't close modal on error - user can retry
    }
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
            submitLabel={mode === 'edit' ? 'Salva' : 'Crea Categoria'}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={controller.isSubmitting}
          />
        }
      >
        <ModalContent>
          {controller.mutationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{controller.mutationError}</p>
            </div>
          )}
          <ModalSection>
            <FormField label="Etichetta" required error={controller.errors.label}>
              <Input
                value={controller.form.label}
                onChange={(e) => controller.setField('label', e.target.value)}
                placeholder="es. Alimentari"
              />
            </FormField>

            <FormField label="Icona" required error={controller.errors.icon}>
              <IconPicker
                value={controller.form.icon}
                onChange={(iconName) => controller.setField('icon', iconName)}
              />
            </FormField>

            <FormField label="Colore" required error={controller.errors.color}>
              <div className="space-y-3">
                <div className="grid grid-cols-8 gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => controller.setField('color', color.value)}
                      className={cn(
                        "group relative aspect-square rounded-lg transition-all duration-200",
                        controller.form.color === color.value
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                          : "hover:scale-105 hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background"
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {controller.form.color === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="h-4 w-4 text-white drop-shadow-lg"
                            fill="none"
                            strokeWidth="3"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <Input
                  value={controller.form.color}
                  onChange={(e) => controller.setField('color', e.target.value)}
                  placeholder="#6366F1"
                />
              </div>
            </FormField>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </form>
  );
}

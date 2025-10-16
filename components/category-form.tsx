"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useCreateCategory, useUpdateCategory } from "@/hooks/use-category-mutations";
import type { Category } from "@/lib/types";
import { X, Tag } from "lucide-react";

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

// Common icon options for categories
const ICON_OPTIONS = [
  '🍔', '🛒', '🏠', '🚗', '⚡', '💊', '🎓', '🎮', '🎬', '📱',
  '👕', '✈️', '🏥', '🎨', '🎵', '📚', '🏋️', '🍕', '☕', '🎁',
  '💼', '🔧', '🌐', '💳', '📊', '🏦', '💰', '📈', '🎯', '🏆'
];

export function CategoryForm({
  isOpen,
  onOpenChange,
  category,
  mode = 'create'
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    label: "",
    key: "",
    icon: "🏷️",
    color: "#6366F1",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showIconPicker, setShowIconPicker] = useState(false);

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && category) {
      setFormData({
        label: category.label,
        key: category.key,
        icon: category.icon,
        color: category.color,
      });
    }
  }, [mode, category]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        label: "",
        key: "",
        icon: "🏷️",
        color: "#6366F1",
      });
      setErrors({});
      setShowIconPicker(false);
    }
  }, [isOpen]);

  // Auto-generate key from label
  useEffect(() => {
    if (mode === 'create' && formData.label) {
      const generatedKey = formData.label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

      setFormData(prev => ({ ...prev, key: generatedKey }));
    }
  }, [formData.label, mode]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) {
      newErrors.label = "L'etichetta è obbligatoria";
    }

    if (!formData.key.trim()) {
      newErrors.key = "La chiave è obbligatoria";
    } else if (!/^[a-z0-9-]+$/.test(formData.key)) {
      newErrors.key = "La chiave può contenere solo lettere minuscole, numeri e trattini";
    }

    if (!formData.icon) {
      newErrors.icon = "Seleziona un'icona";
    }

    if (!formData.color) {
      newErrors.color = "Seleziona un colore";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const categoryData = {
      label: formData.label.trim(),
      key: formData.key.trim(),
      icon: formData.icon,
      color: formData.color,
    };

    try {
      if (mode === 'edit' && category) {
        await updateCategoryMutation.mutateAsync({
          id: category.id,
          data: categoryData,
        });
      } else {
        await createCategoryMutation.mutateAsync(categoryData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving category:', error);
      setErrors({ submit: 'Errore nel salvataggio della categoria' });
    }
  };

  const isLoading = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white border border-[#7578EC]/30 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <DialogTitle className="text-xl font-bold text-[#7578EC]">
            {mode === 'edit' ? 'Modifica Categoria' : 'Nuova Categoria'}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0 rounded-full hover:bg-[#7578EC]/10 text-[#7578EC]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label" className="text-sm font-semibold text-[#7578EC]">
              Etichetta <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7578EC]/60" />
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="es. Alimentari"
                className={`pl-9 bg-white border-[#7578EC]/30 focus:border-[#7578EC] focus:ring-[#7578EC]/20 ${errors.label ? "border-red-500" : ""}`}
              />
            </div>
            {errors.label && (
              <p className="text-xs text-red-500">{errors.label}</p>
            )}
          </div>

          {/* Key (read-only when editing) */}
          <div className="space-y-2">
            <Label htmlFor="key" className="text-sm font-semibold text-[#7578EC]">
              Chiave <span className="text-red-500">*</span>
            </Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="es. alimentari"
              className={`bg-white border-[#7578EC]/30 focus:border-[#7578EC] focus:ring-[#7578EC]/20 ${errors.key ? "border-red-500" : ""} ${mode === 'edit' ? 'opacity-60' : ''}`}
              disabled={mode === 'edit'}
            />
            <p className="text-xs text-[#7578EC]/60">
              {mode === 'edit'
                ? "La chiave non può essere modificata"
                : "Generata automaticamente dall'etichetta"}
            </p>
            {errors.key && (
              <p className="text-xs text-red-500">{errors.key}</p>
            )}
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#7578EC]">
              Icona <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2">
              <Button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full justify-start bg-white border border-[#7578EC]/30 text-[#7578EC] hover:bg-[#7578EC]/10 hover:border-[#7578EC] shadow-sm"
              >
                <span className="text-2xl mr-2">{formData.icon}</span>
                <span className="text-sm">Seleziona icona</span>
              </Button>

              {showIconPicker && (
                <div className="grid grid-cols-10 gap-2 p-3 border border-[#7578EC]/30 rounded-xl bg-white max-h-48 overflow-y-auto">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, icon });
                        setShowIconPicker(false);
                      }}
                      className={`text-2xl p-2 rounded-lg hover:bg-[#7578EC]/10 transition-all duration-200 ${
                        formData.icon === icon ? 'bg-[#7578EC]/10 ring-2 ring-[#7578EC]' : ''
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.icon && (
              <p className="text-xs text-red-500">{errors.icon}</p>
            )}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#7578EC]">
              Colore <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-8 gap-2 p-3 border border-[#7578EC]/30 rounded-xl bg-white">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`h-10 rounded-lg transition-all ${
                    formData.color === color.value
                      ? 'ring-2 ring-offset-2 ring-[#7578EC]'
                      : 'hover:opacity-80'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            {errors.color && (
              <p className="text-xs text-red-500">{errors.color}</p>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#7578EC]">
              Anteprima
            </Label>
            <div className="p-4 border border-[#7578EC]/30 rounded-xl bg-white">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${formData.color}20` }}
                >
                  {formData.icon}
                </div>
                <div>
                  <p className="font-semibold text-black">{formData.label || 'Nome categoria'}</p>
                  <p className="text-sm text-[#7578EC]/60">{formData.key || 'chiave-categoria'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-white border border-[#7578EC]/30 text-[#7578EC] hover:bg-[#7578EC]/10 hover:border-[#7578EC] shadow-sm"
              disabled={isLoading}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#7578EC] text-white hover:bg-[#7578EC]/90 transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Salvataggio...' : mode === 'edit' ? 'Salva' : 'Crea Categoria'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateBudget, useUpdateBudget } from "@/hooks/use-budget-mutations";
import { useCategories, useUsers } from "@/hooks";
import type { Budget, BudgetType } from "@/lib/types";
import { X, Wallet } from "lucide-react";
import { CategoryIcon, iconSizes } from "@/lib/icons";

interface BudgetFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserId?: string;
  budget?: Budget; // For editing existing budgets
  mode?: 'create' | 'edit';
}

export function BudgetForm({
  isOpen,
  onOpenChange,
  selectedUserId,
  budget,
  mode = 'create'
}: BudgetFormProps) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "monthly" as BudgetType,
    categories: [] as string[],
    user_id: selectedUserId || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: categories = [] } = useCategories();
  const { data: users = [] } = useUsers();

  // Sort categories alphabetically by label
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.label.localeCompare(b.label, 'it'));
  }, [categories]);

  // Sort users alphabetically by name
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  }, [users]);

  const createBudgetMutation = useCreateBudget();
  const updateBudgetMutation = useUpdateBudget();

  // Prefill user when selectedUserId prop changes
  useEffect(() => {
    if (selectedUserId && mode === 'create') {
      setFormData(prev => ({
        ...prev,
        user_id: selectedUserId,
      }));
    }
  }, [selectedUserId, mode]);

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && budget) {
      setFormData({
        description: budget.description,
        amount: budget.amount.toString(),
        type: budget.type,
        categories: budget.categories || [],
        user_id: budget.user_id,
      });
    }
  }, [mode, budget]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        description: "",
        amount: "",
        type: "monthly",
        categories: [],
        user_id: selectedUserId || "",
      });
      setErrors({});
    }
  }, [isOpen, selectedUserId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = "La descrizione è obbligatoria";
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = "Inserisci un importo valido maggiore di 0";
    }

    if (!formData.user_id) {
      newErrors.user_id = "Seleziona un utente";
    }

    if (formData.categories.length === 0) {
      newErrors.categories = "Seleziona almeno una categoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const budgetData = {
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      type: formData.type,
      categories: formData.categories,
      user_id: formData.user_id,
    };

    try {
      if (mode === 'edit' && budget) {
        await updateBudgetMutation.mutateAsync({
          id: budget.id,
          data: budgetData,
        });
      } else {
        await createBudgetMutation.mutateAsync(budgetData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving budget:', error);
      setErrors({ submit: 'Errore nel salvataggio del budget' });
    }
  };

  const toggleCategory = (categoryKey: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryKey)
        ? prev.categories.filter(c => c !== categoryKey)
        : [...prev.categories, categoryKey]
    }));
  };

  const isLoading = createBudgetMutation.isPending || updateBudgetMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white border border-[#7578EC]/30 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <DialogTitle className="text-xl font-bold text-[#7578EC]">
            {mode === 'edit' ? 'Modifica Budget' : 'Nuovo Budget'}
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
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-[#7578EC]">
              Descrizione <span className="text-red-500">*</span>
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="es. Spese mensili"
              className={`bg-white border-[#7578EC]/30 focus:border-[#7578EC] focus:ring-[#7578EC]/20 ${errors.description ? "border-red-500" : ""}`}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-semibold text-[#7578EC]">
              Importo (€) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7578EC]/60" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className={`pl-9 bg-white border-[#7578EC]/30 focus:border-[#7578EC] focus:ring-[#7578EC]/20 ${errors.amount ? "border-red-500" : ""}`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* Budget Type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#7578EC]">
              Tipo Budget
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'monthly' })}
                className={`flex-1 ${formData.type === 'monthly' ? 'bg-[#7578EC] text-white hover:bg-[#7578EC]/90' : 'bg-white border border-[#7578EC]/30 text-[#7578EC] hover:bg-[#7578EC]/10'}`}
              >
                Mensile
              </Button>
              <Button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'annually' })}
                className={`flex-1 ${formData.type === 'annually' ? 'bg-[#7578EC] text-white hover:bg-[#7578EC]/90' : 'bg-white border border-[#7578EC]/30 text-[#7578EC] hover:bg-[#7578EC]/10'}`}
              >
                Annuale
              </Button>
            </div>
          </div>

          {/* User Selection */}
          {!selectedUserId && (
            <div className="space-y-2">
              <Label htmlFor="user_id" className="text-sm font-semibold text-[#7578EC]">
                Utente <span className="text-red-500">*</span>
              </Label>
              <select
                id="user_id"
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                className={`w-full rounded-md border bg-white ${errors.user_id ? 'border-red-500' : 'border-[#7578EC]/30'} px-3 py-2 focus:border-[#7578EC] focus:ring-2 focus:ring-[#7578EC]/20 transition-all`}
              >
                <option value="">Seleziona utente</option>
                {sortedUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {errors.user_id && (
                <p className="text-xs text-red-500">{errors.user_id}</p>
              )}
            </div>
          )}

          {/* Categories */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#7578EC]">
              Categorie <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-3 border border-[#7578EC]/30 rounded-xl bg-white">
              {sortedCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center space-x-2 p-2 hover:bg-[#7578EC]/10 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-[#7578EC]/30"
                >
                  <Checkbox
                    id={category.id}
                    checked={formData.categories.includes(category.key)}
                    onCheckedChange={() => toggleCategory(category.key)}
                  />
                  <div
                    className="flex items-center gap-2 flex-1"
                    onClick={() => toggleCategory(category.key)}
                  >
                    <CategoryIcon
                      categoryKey={category.key}
                      size={iconSizes.sm}
                    />
                    <label
                      htmlFor={category.id}
                      className="text-sm font-medium cursor-pointer text-black"
                    >
                      {category.label}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {errors.categories && (
              <p className="text-xs text-red-500">{errors.categories}</p>
            )}
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
              {isLoading ? 'Salvataggio...' : mode === 'edit' ? 'Salva' : 'Crea Budget'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

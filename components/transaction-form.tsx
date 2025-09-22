"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CategoryIcon, iconSizes } from "@/lib/icons";
import { useCreateTransaction, useCategories, useAccounts, useUsers } from "@/hooks";
import type { TransactionType, TransactionFrequencyType } from "@/lib/types";

interface TransactionFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: TransactionType;
  selectedUserId?: string;
}

export function TransactionForm({ isOpen, onOpenChange, initialType = "expense", selectedUserId }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: initialType as TransactionType,
    category: "",
    date: new Date().toISOString().split('T')[0],
    user_id: selectedUserId || "",
    account_id: "",
    to_account_id: "",
    frequency: "once" as TransactionFrequencyType,
  });

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: users = [] } = useUsers();
  const createTransactionMutation = useCreateTransaction();

  useEffect(() => {
    if (selectedUserId) {
      setFormData(prev => ({ ...prev, user_id: selectedUserId }));
    }
  }, [selectedUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedUser = users.find(user => user.id === formData.user_id);

      const transactionData = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        user_id: formData.user_id,
        account_id: formData.account_id,
        to_account_id: formData.type === 'transfer' ? formData.to_account_id : null,
        // Persist frequency always; consumers will treat 'once' as non-ricorrente
        frequency: formData.frequency,
        group_id: selectedUser?.group_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await createTransactionMutation.mutateAsync(transactionData);

      // Reset form
      setFormData({
        description: "",
        amount: "",
        type: initialType,
        category: "",
        date: new Date().toISOString().split('T')[0],
        user_id: selectedUserId || "",
        account_id: "",
        to_account_id: "",
        frequency: "once",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const userAccounts = accounts.filter(account =>
    account.user_ids.includes(formData.user_id)
  );

  const transferAccounts = accounts.filter(account =>
    account.user_ids.includes(formData.user_id) && account.id !== formData.account_id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Aggiungi Transazione
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Utente</label>
            <Select value={formData.user_id} onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value, account_id: "" }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona utente" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tipo</label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as TransactionType, category: "" }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Spesa</SelectItem>
                <SelectItem value="income">Entrata</SelectItem>
                <SelectItem value="transfer">Trasferimento</SelectItem>
                {/* Ricorrente removed as a type; use frequency below */}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Descrizione</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Es. Spesa supermercato"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Importo</label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          {/* Category (not for transfers) */}
          {formData.type !== 'transfer' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Categoria</label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.key} value={category.key}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon categoryKey={category.key} size={iconSizes.sm} />
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Data</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          {/* Account */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {formData.type === 'transfer' ? 'Conto di origine' : 'Conto'}
            </label>
            <Select value={formData.account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, account_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona conto" />
              </SelectTrigger>
              <SelectContent>
                {userAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* To Account (only for transfers) */}
          {formData.type === 'transfer' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Conto di destinazione</label>
              <Select value={formData.to_account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, to_account_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona conto di destinazione" />
                </SelectTrigger>
                <SelectContent>
                  {transferAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Frequency (now independent from type; 'once' means non ricorrente) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Frequenza</label>
            <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value as TransactionFrequencyType }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Una tantum</SelectItem>
                <SelectItem value="weekly">Settimanale</SelectItem>
                <SelectItem value="biweekly">Quindicinale</SelectItem>
                <SelectItem value="monthly">Mensile</SelectItem>
                <SelectItem value="yearly">Annuale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annulla
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createTransactionMutation.isPending}
            >
              {createTransactionMutation.isPending ? 'Salvando...' : 'Salva'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

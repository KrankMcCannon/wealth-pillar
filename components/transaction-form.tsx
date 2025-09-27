"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CategoryIcon, iconSizes } from "@/lib/icons";
import { useCreateTransaction, useUpdateTransaction, useCategories, useAccounts, useUsers } from "@/hooks";
import type { TransactionType, TransactionFrequencyType, Transaction } from "@/lib/types";
import { CreditCard, ArrowRightLeft, Minus, Plus, X } from "lucide-react";

interface TransactionFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: TransactionType;
  selectedUserId?: string;
  transaction?: Transaction; // For editing existing transactions
  mode?: 'create' | 'edit';
}

export function TransactionForm({ isOpen, onOpenChange, initialType = "expense", selectedUserId, transaction, mode = 'create' }: TransactionFormProps) {
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

  // Sort categories alphabetically by label
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.label.localeCompare(b.label, 'it'));
  }, [categories]);

  // Sort users alphabetically by name
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  }, [users]);

  // Sort accounts alphabetically by name
  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  }, [accounts]);

  const createTransactionMutation = useCreateTransaction();
  const updateTransactionMutation = useUpdateTransaction();

  useEffect(() => {
    if (selectedUserId) {
      setFormData(prev => ({ ...prev, user_id: selectedUserId }));
    }
  }, [selectedUserId]);

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && transaction) {
      setFormData({
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category,
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        user_id: transaction.user_id,
        account_id: transaction.account_id,
        to_account_id: transaction.to_account_id || "",
        frequency: transaction.frequency || "once",
      });
    }
  }, [mode, transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedUser = users.find(user => user.id === formData.user_id);

      if (mode === 'edit' && transaction) {
        // Update existing transaction
        const updateData = {
          description: formData.description,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          date: new Date(formData.date).toISOString(),
          user_id: formData.user_id,
          account_id: formData.account_id,
          to_account_id: formData.type === 'transfer' ? formData.to_account_id : null,
          frequency: formData.frequency,
          updated_at: new Date().toISOString(),
        };

        await updateTransactionMutation.mutateAsync({
          id: transaction.id,
          data: updateData
        });
      } else {
        // Create new transaction
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
          frequency: formData.frequency,
          group_id: selectedUser?.group_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await createTransactionMutation.mutateAsync(transactionData);
      }

      // Reset form only if creating new transaction
      if (mode === 'create') {
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
      }

      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} transaction:`, error);
    }
  };

  const userAccounts = useMemo(() => {
    return sortedAccounts.filter(account =>
      account.user_ids.includes(formData.user_id)
    );
  }, [sortedAccounts, formData.user_id]);

  const transferAccounts = useMemo(() => {
    return sortedAccounts.filter(account =>
      account.user_ids.includes(formData.user_id) && account.id !== formData.account_id
    );
  }, [sortedAccounts, formData.user_id, formData.account_id]);

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'expense': return <Minus className="h-4 w-4" />;
      case 'income': return <Plus className="h-4 w-4" />;
      case 'transfer': return <ArrowRightLeft className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] max-w-sm max-h-[90vh] p-0 gap-0 bg-white border-0 shadow-xl rounded-xl overflow-hidden" showCloseButton={false}>
        <DialogTitle className="sr-only">{mode === 'edit' ? 'Modifica Transazione' : 'Aggiungi Transazione'}</DialogTitle>

        {/* Compact Header */}
        <div className="bg-gradient-to-r from-[#7578EC] to-[#669BBC] p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{mode === 'edit' ? 'Modifica' : 'Nuova'}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-7 h-7 p-0 rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Compact Content */}
        <div className="p-3 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selection - Compact Pills */}
            <div>
              <Label className="text-xs font-bold text-black mb-2 block">Tipo</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['expense', 'income', 'transfer'] as TransactionType[]).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant="ghost"
                    className={`h-10 text-xs rounded-lg transition-all ${
                      formData.type === type
                        ? 'bg-[#7578EC] text-white'
                        : 'bg-white border border-[#7578EC]/20 text-black hover:bg-[#7578EC]/5'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, type, category: "" }))}
                  >
                    {getTypeIcon(type)}
                    <span className="ml-1">
                      {type === 'expense' ? 'Spesa' : type === 'income' ? 'Entrata' : 'Trasf.'}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* User Selection - Compact */}
            <div>
              <Label className="text-xs font-bold text-black mb-1 block">Utente</Label>
              <Select value={formData.user_id} onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value, account_id: "" }))}>
                <SelectTrigger className="h-9 bg-white border border-[#7578EC]/20 rounded-lg text-black text-sm">
                  <SelectValue placeholder="Scegli utente" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#7578EC]/20 rounded-lg">
                  {sortedUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="text-black hover:bg-[#7578EC]/5">
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            {/* Description and Amount - Compact */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-black mb-1 block">Descrizione</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Es. Spesa"
                  className="h-9 bg-white border border-[#7578EC]/20 rounded-lg text-black text-sm"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-black mb-1 block">Importo (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="h-9 bg-white border border-[#7578EC]/20 rounded-lg text-black text-sm text-right font-bold"
                  required
                />
              </div>
            </div>

            {/* Category - Compact */}
            {formData.type !== 'transfer' && (
              <div>
                <Label className="text-xs font-bold text-black mb-1 block">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="h-9 bg-white border border-[#7578EC]/20 rounded-lg text-black text-sm">
                    <SelectValue placeholder="Scegli categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#7578EC]/20 rounded-lg max-h-48">
                    {sortedCategories.map((category) => (
                      <SelectItem key={category.key} value={category.key} className="text-black hover:bg-[#7578EC]/5">
                        <div className="flex items-center gap-2">
                          <CategoryIcon categoryKey={category.key} size={iconSizes.sm} />
                          <span className="text-sm">{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date and Frequency - Compact Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-black mb-1 block">Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="h-9 bg-white border border-[#7578EC]/20 rounded-lg text-black text-sm"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-black mb-1 block">Frequenza</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value as TransactionFrequencyType }))}>
                  <SelectTrigger className="h-9 bg-white border border-[#7578EC]/20 rounded-lg text-black text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#7578EC]/20 rounded-lg">
                    <SelectItem value="once" className="text-black hover:bg-[#7578EC]/5">Una tantum</SelectItem>
                    <SelectItem value="weekly" className="text-black hover:bg-[#7578EC]/5">Settimanale</SelectItem>
                    <SelectItem value="biweekly" className="text-black hover:bg-[#7578EC]/5">Quindicinale</SelectItem>
                    <SelectItem value="monthly" className="text-black hover:bg-[#7578EC]/5">Mensile</SelectItem>
                    <SelectItem value="yearly" className="text-black hover:bg-[#7578EC]/5">Annuale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Account - Compact */}
            <div>
              <Label className="text-xs font-bold text-black mb-1 block">
                {formData.type === 'transfer' ? 'Conto Origine' : 'Conto'}
              </Label>
              <Select value={formData.account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, account_id: value }))}>
                <SelectTrigger className="h-9 bg-white border border-[#7578EC]/20 rounded-lg text-black text-sm">
                  <SelectValue placeholder="Scegli conto" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#7578EC]/20 rounded-lg">
                  {userAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id} className="text-black hover:bg-[#7578EC]/5">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3 w-3" />
                        <span className="text-sm">{account.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transfer Destination - Compact */}
            {formData.type === 'transfer' && (
              <div>
                <Label className="text-xs font-bold text-black mb-1 block">Conto Destinazione</Label>
                <Select value={formData.to_account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, to_account_id: value }))}>
                  <SelectTrigger className="h-9 bg-white border border-[#7578EC]/20 rounded-lg text-black text-sm">
                    <SelectValue placeholder="Scegli destinazione" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#7578EC]/20 rounded-lg">
                    {transferAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id} className="text-black hover:bg-[#7578EC]/5">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="h-3 w-3" />
                          <span className="text-sm">{account.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}


          </form>

          {/* Single Action Button */}
          <div className="pt-4 border-t border-[#7578EC]/10">
            <Button
              type="submit"
              onClick={handleSubmit}
              className="w-full h-10 bg-gradient-to-r from-[#7578EC] to-[#669BBC] text-white rounded-lg text-sm font-bold"
              disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending}
            >
              {(createTransactionMutation.isPending || updateTransactionMutation.isPending) ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </div>
              ) : (
                <span>{mode === 'edit' ? 'Aggiorna' : 'Salva'}</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

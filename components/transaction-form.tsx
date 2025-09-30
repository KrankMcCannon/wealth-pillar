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
import { CreditCard, ArrowRightLeft, Minus, Plus, X, Calendar } from "lucide-react";

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

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Prefill user and default account when selectedUserId prop changes
  useEffect(() => {
    if (selectedUserId && mode === 'create') {
      setFormData(prev => ({
        ...prev,
        user_id: selectedUserId,
        account_id: '', // Reset account when user changes via prop
      }));
    }
  }, [selectedUserId, mode]);

  // Prefill default account when user is selected and we have accounts loaded
  useEffect(() => {
    if (formData.user_id && mode === 'create' && users.length > 0 && accounts.length > 0) {
      const selectedUser = users.find(user => user.id === formData.user_id);

      if (selectedUser?.default_account_id) {
        const defaultAccount = accounts.find(acc =>
          acc.id === selectedUser.default_account_id &&
          acc.user_ids.includes(formData.user_id)
        );

        if (defaultAccount && !formData.account_id) {
          setFormData(prev => ({ ...prev, account_id: defaultAccount.id }));
        }
      }
    }
  }, [formData.user_id, users, accounts, mode, formData.account_id]);

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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen && mode === 'create') {
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
      setErrors({});
    }
  }, [isOpen, mode, initialType, selectedUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    const newErrors: Record<string, string> = {};

    // Validation
    if (!formData.user_id) {
      newErrors.user_id = 'Seleziona un utente';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Inserisci una descrizione';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Inserisci un importo valido';
    }
    if (formData.type !== 'transfer' && !formData.category) {
      newErrors.category = 'Seleziona una categoria';
    }
    if (!formData.account_id) {
      newErrors.account_id = 'Seleziona un conto';
    }
    if (formData.type === 'transfer' && !formData.to_account_id) {
      newErrors.to_account_id = 'Seleziona un conto di destinazione';
    }
    if (formData.type === 'transfer' && formData.account_id === formData.to_account_id) {
      newErrors.to_account_id = 'Il conto origine e destinazione devono essere diversi';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
              <Select value={formData.user_id} onValueChange={(value) => { setFormData(prev => ({ ...prev, user_id: value, account_id: "" })); setErrors(prev => ({ ...prev, user_id: '' })); }}>
                <SelectTrigger className={`h-9 bg-white rounded-lg text-black text-sm ${errors.user_id ? 'border-2 border-red-500' : 'border border-[#7578EC]/20'}`}>
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
              {errors.user_id && <p className="text-xs text-red-500 mt-1">{errors.user_id}</p>}
            </div>


            {/* Description and Amount - Compact */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-black mb-1 block">Descrizione</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => { setFormData(prev => ({ ...prev, description: e.target.value })); setErrors(prev => ({ ...prev, description: '' })); }}
                  placeholder="Es. Spesa"
                  className={`h-9 bg-white rounded-lg text-black text-sm ${errors.description ? 'border-2 border-red-500' : 'border border-[#7578EC]/20'}`}
                  required
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>
              <div>
                <Label className="text-xs font-bold text-black mb-1 block">Importo (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => { setFormData(prev => ({ ...prev, amount: e.target.value })); setErrors(prev => ({ ...prev, amount: '' })); }}
                  placeholder="0.00"
                  className={`h-9 bg-white rounded-lg text-black text-sm text-right font-bold ${errors.amount ? 'border-2 border-red-500' : 'border border-[#7578EC]/20'}`}
                  required
                />
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>
            </div>

            {/* Category - Compact */}
            {formData.type !== 'transfer' && (
              <div>
                <Label className="text-xs font-bold text-black mb-1 block">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => { setFormData(prev => ({ ...prev, category: value })); setErrors(prev => ({ ...prev, category: '' })); }}>
                  <SelectTrigger className={`h-9 bg-white rounded-lg text-black text-sm ${errors.category ? 'border-2 border-red-500' : 'border border-[#7578EC]/20'}`}>
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
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>
            )}

            {/* Date and Frequency - Compact Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <Label className="text-xs font-bold text-black mb-1 block">Data</Label>
                <div className="relative w-full">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#7578EC] pointer-events-none z-10" />
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="h-9 w-full pl-9 pr-3 bg-white border border-[#7578EC]/20 rounded-lg text-black text-sm [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{ position: 'relative' }}
                    required
                  />
                </div>
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
              <Select value={formData.account_id} onValueChange={(value) => { setFormData(prev => ({ ...prev, account_id: value })); setErrors(prev => ({ ...prev, account_id: '' })); }}>
                <SelectTrigger className={`h-9 bg-white rounded-lg text-black text-sm ${errors.account_id ? 'border-2 border-red-500' : 'border border-[#7578EC]/20'}`}>
                  <SelectValue placeholder="Scegli conto" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#7578EC]/20 rounded-lg">
                  {userAccounts.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {formData.user_id ? 'Nessun conto disponibile' : 'Seleziona prima un utente'}
                    </div>
                  ) : (
                    userAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id} className="text-black hover:bg-[#7578EC]/5">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3 w-3" />
                          <span className="text-sm">{account.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.account_id && <p className="text-xs text-red-500 mt-1">{errors.account_id}</p>}
            </div>

            {/* Transfer Destination - Compact */}
            {formData.type === 'transfer' && (
              <div>
                <Label className="text-xs font-bold text-black mb-1 block">Conto Destinazione</Label>
                <Select value={formData.to_account_id} onValueChange={(value) => { setFormData(prev => ({ ...prev, to_account_id: value })); setErrors(prev => ({ ...prev, to_account_id: '' })); }}>
                  <SelectTrigger className={`h-9 bg-white rounded-lg text-black text-sm ${errors.to_account_id ? 'border-2 border-red-500' : 'border border-[#7578EC]/20'}`}>
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
                {errors.to_account_id && <p className="text-xs text-red-500 mt-1">{errors.to_account_id}</p>}
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

"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CategoryIcon, iconSizes } from "@/lib/icons";
import { useCreateTransaction, useCategories, useAccounts, useUsers } from "@/hooks";
import type { TransactionType, TransactionFrequencyType } from "@/lib/types";
import { User, Calendar, CreditCard, ArrowRightLeft, TrendingUp, Minus, Plus, Repeat } from "lucide-react";

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

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'expense': return 'from-red-500 to-red-600';
      case 'income': return 'from-emerald-500 to-emerald-600';
      case 'transfer': return 'from-blue-500 to-blue-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-3xl">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Aggiungi Transazione
          </DialogTitle>
          <p className="text-xs text-slate-600 mt-1">Inserisci i dettagli della tua nuova transazione</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Tipo di Transazione
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(['expense', 'income', 'transfer'] as TransactionType[]).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={formData.type === type ? "default" : "outline"}
                  className={`h-12 flex items-center justify-center gap-2 rounded-xl transition-all duration-200 ${
                    formData.type === type
                      ? `bg-gradient-to-r ${getTypeColor(type)} text-white shadow-lg`
                      : 'hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, type, category: "" }))}
                >
                  {getTypeIcon(type)}
                  <span className="text-sm font-medium">
                    {type === 'expense' ? 'Spesa' : type === 'income' ? 'Entrata' : 'Trasferimento'}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User className="h-4 w-4" />
              Utente
            </Label>
            <Select value={formData.user_id} onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value, account_id: "" }))}>
              <SelectTrigger className="h-12 bg-white border-slate-200 shadow-sm rounded-xl hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all">
                <SelectValue placeholder="Seleziona utente" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-md border border-slate-200/60 shadow-xl rounded-xl">
                {sortedUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="hover:bg-slate-50 rounded-lg py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-600" />
                      </div>
                      <span className="font-medium text-slate-700">{user.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          {/* Description and Amount - Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Descrizione</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Es. Spesa supermercato"
                className="h-12 bg-white border-slate-200 shadow-sm rounded-xl hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                required
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">Importo (€)</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className="h-12 bg-white border-slate-200 shadow-sm rounded-xl hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all pl-12 text-right font-semibold"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">
                  €
                </div>
              </div>
            </div>
          </div>

          {/* Category (not for transfers) */}
          {formData.type !== 'transfer' && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-400 to-orange-500" />
                Categoria
              </Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="h-12 bg-white border-slate-200 shadow-sm rounded-xl hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all">
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border border-slate-200/60 shadow-xl rounded-xl max-h-60">
                  {sortedCategories.map((category) => (
                    <SelectItem key={category.key} value={category.key} className="hover:bg-slate-50 rounded-lg py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: category.color + '20' }}>
                          <CategoryIcon categoryKey={category.key} size={iconSizes.sm} />
                        </div>
                        <span className="font-medium text-slate-700">{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date and Frequency - Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data
              </Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="h-12 bg-white border-slate-200 shadow-sm rounded-xl hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Frequenza
              </Label>
              <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value as TransactionFrequencyType }))}>
                <SelectTrigger className="h-12 bg-white border-slate-200 shadow-sm rounded-xl hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border border-slate-200/60 shadow-xl rounded-xl">
                  <SelectItem value="once" className="hover:bg-slate-50 rounded-lg py-2 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>Una tantum</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="weekly" className="hover:bg-slate-50 rounded-lg py-2 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>Settimanale</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="biweekly" className="hover:bg-slate-50 rounded-lg py-2 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span>Quindicinale</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="monthly" className="hover:bg-slate-50 rounded-lg py-2 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <span>Mensile</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="yearly" className="hover:bg-slate-50 rounded-lg py-2 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <span>Annuale</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Account */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {formData.type === 'transfer' ? 'Conto di Origine' : 'Conto'}
            </Label>
            <Select value={formData.account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, account_id: value }))}>
              <SelectTrigger className="h-12 bg-white border-slate-200 shadow-sm rounded-xl hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all">
                <SelectValue placeholder="Seleziona conto" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-md border border-slate-200/60 shadow-xl rounded-xl">
                {userAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id} className="hover:bg-slate-50 rounded-lg py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{account.name}</span>
                        <Badge variant="secondary" className="text-xs w-fit mt-1 capitalize">{account.type}</Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* To Account (only for transfers) */}
          {formData.type === 'transfer' && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Conto di Destinazione
              </Label>
              <Select value={formData.to_account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, to_account_id: value }))}>
                <SelectTrigger className="h-12 bg-white border-slate-200 shadow-sm rounded-xl hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all">
                  <SelectValue placeholder="Seleziona conto di destinazione" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border border-slate-200/60 shadow-xl rounded-xl">
                  {transferAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id} className="hover:bg-slate-50 rounded-lg py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">{account.name}</span>
                          <Badge variant="secondary" className="text-xs w-fit mt-1 capitalize">{account.type}</Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}


          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-xl border-slate-200 hover:bg-slate-50 transition-all duration-200 font-medium"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-xl rounded-xl transition-all duration-200 font-semibold"
              disabled={createTransactionMutation.isPending}
            >
              {createTransactionMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Salva Transazione</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

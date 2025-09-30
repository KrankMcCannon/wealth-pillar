"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts, useCategories, useCreateRecurringSeries, useUpdateRecurringSeries, useUsers } from "@/hooks";
import type { RecurringTransactionSeries, TransactionFrequencyType, TransactionType } from "@/lib/types";
import { Minus, Plus, X, CreditCard, Calendar } from "lucide-react";

type Mode = 'create' | 'edit';

interface RecurringSeriesFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserId?: string;
  series?: RecurringTransactionSeries;
  mode?: Mode;
}

export function RecurringSeriesForm({ isOpen, onOpenChange, selectedUserId, series, mode = 'create' }: RecurringSeriesFormProps) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: 'expense' as TransactionType,
    category: "",
    frequency: 'monthly' as TransactionFrequencyType,
    user_id: selectedUserId || "",
    account_id: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    due_date: new Date().toISOString().split('T')[0],
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: users = [] } = useUsers();

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.label.localeCompare(b.label, 'it')), [categories]);
  const sortedUsers = useMemo(() => [...users].sort((a, b) => a.name.localeCompare(b.name, 'it')), [users]);
  const sortedAccounts = useMemo(() => [...accounts].sort((a, b) => a.name.localeCompare(b.name, 'it')), [accounts]);

  const createSeriesMutation = useCreateRecurringSeries();
  const updateSeriesMutation = useUpdateRecurringSeries();

  useEffect(() => {
    if (selectedUserId) {
      const selectedUser = users.find(user => user.id === selectedUserId);
      setFormData(prev => ({
        ...prev,
        user_id: selectedUserId,
        // Prefill account_id with user's default account if available and account belongs to user
        account_id: selectedUser?.default_account_id &&
                    accounts.some(acc => acc.id === selectedUser.default_account_id && acc.user_ids.includes(selectedUserId))
                    ? selectedUser.default_account_id
                    : prev.account_id
      }));
    }
  }, [selectedUserId, users, accounts]);

  // Prefill default account when user changes in form (only if no account selected yet)
  useEffect(() => {
    if (formData.user_id && !formData.account_id && mode === 'create') {
      const selectedUser = users.find(user => user.id === formData.user_id);
      if (selectedUser?.default_account_id) {
        const defaultAccount = accounts.find(acc =>
          acc.id === selectedUser.default_account_id &&
          acc.user_ids.includes(formData.user_id)
        );
        if (defaultAccount) {
          setFormData(prev => ({ ...prev, account_id: defaultAccount.id }));
        }
      }
    }
  }, [formData.user_id, formData.account_id, users, accounts, mode]);

  useEffect(() => {
    if (mode === 'edit' && series) {
      setFormData({
        description: series.description,
        amount: String(series.amount),
        type: series.type,
        category: series.category,
        frequency: series.frequency,
        user_id: series.user_id,
        account_id: series.account_id,
        start_date: new Date(series.start_date).toISOString().split('T')[0],
        end_date: series.end_date ? new Date(series.end_date).toISOString().split('T')[0] : "",
        due_date: new Date(series.due_date).toISOString().split('T')[0],
        is_active: series.is_active,
      });
    }
  }, [mode, series]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen && mode === 'create') {
      setFormData({
        description: "",
        amount: "",
        type: 'expense',
        category: "",
        frequency: 'monthly',
        user_id: selectedUserId || "",
        account_id: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        due_date: new Date().toISOString().split('T')[0],
        is_active: true,
      });
      setErrors({});
    }
  }, [isOpen, mode, selectedUserId]);

  const userAccounts = useMemo(() => sortedAccounts.filter(a => a.user_ids.includes(formData.user_id)), [sortedAccounts, formData.user_id]);

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'expense': return <Minus className="h-4 w-4" />;
      case 'income': return <Plus className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />; // limit to expense/income in UI
    }
  };

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
    if (!formData.category) {
      newErrors.category = 'Seleziona una categoria';
    }
    if (!formData.account_id) {
      newErrors.account_id = 'Seleziona un conto';
    }
    if (formData.end_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      newErrors.end_date = 'La data di fine deve essere successiva alla data di inizio';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const base = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        frequency: formData.frequency,
        user_id: formData.user_id,
        account_id: formData.account_id,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        due_date: new Date(formData.due_date).toISOString(),
        is_active: formData.is_active,
        total_executions: mode === 'edit' && series ? series.total_executions : 0,
        transaction_ids: mode === 'edit' && series && series.transaction_ids ? series.transaction_ids : [],
      };

      if (mode === 'edit' && series) {
        await updateSeriesMutation.mutateAsync({ id: series.id, data: base });
      } else {
        await createSeriesMutation.mutateAsync(base as Omit<RecurringTransactionSeries, 'id'>);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving recurring series:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] max-w-sm max-h-[90vh] p-0 gap-0 bg-white border-0 shadow-xl rounded-xl overflow-hidden" showCloseButton={false}>
        <DialogTitle className="sr-only">{mode === 'edit' ? 'Modifica Serie Ricorrente' : 'Nuova Serie Ricorrente'}</DialogTitle>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#7578EC] to-[#669BBC] p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{mode === 'edit' ? 'Modifica Serie' : 'Nuova Serie'}</h2>
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

        {/* Content */}
        <div className="p-3 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo (solo expense/income) */}
            <div>
              <Label className="text-xs font-bold text-black mb-2 block">Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['expense', 'income'] as TransactionType[]).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant="ghost"
                    className={`h-10 text-xs rounded-lg transition-all ${
                      formData.type === type
                        ? 'bg-[#7578EC] text-white'
                        : 'bg-white border border-[#7578EC]/20 text-black hover:bg-[#7578EC]/5'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, type }))}
                  >
                    {getTypeIcon(type)}
                    <span className="ml-1">{type === 'expense' ? 'Uscita' : 'Entrata'}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Utente */}
            <div>
              <Label className="text-xs font-bold text-black mb-1 block">Utente</Label>
              <Select value={formData.user_id} onValueChange={(value) => { setFormData(prev => ({ ...prev, user_id: value, account_id: "" })); setErrors(prev => ({ ...prev, user_id: '' })); }}>
                <SelectTrigger className={`h-9 bg-white ${errors.user_id ? 'border-2 border-red-500' : 'border border-[#7578EC]/20'} rounded-lg text-black text-sm`}>
                  <SelectValue placeholder="Scegli utente" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#7578EC]/20 rounded-lg">
                  {sortedUsers.map(user => (
                    <SelectItem key={user.id} value={user.id} className="text-black hover:bg-[#7578EC]/5">
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user_id && <p className="text-xs text-red-500 mt-1">{errors.user_id}</p>}
            </div>

            {/* Descrizione e Importo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-black mb-1 block">Descrizione</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => { setFormData(prev => ({ ...prev, description: e.target.value })); setErrors(prev => ({ ...prev, description: '' })); }}
                  placeholder="Es. Abbonamento Netflix"
                  className={`h-9 bg-white ${errors.description ? 'border-2 border-red-500' : 'border border-[#7578EC]/20'} rounded-lg text-black text-sm`}
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
                  className={`h-9 bg-white ${errors.amount ? 'border-2 border-red-500' : 'border border-[#7578EC]/20'} rounded-lg text-black text-sm text-right font-bold`}
                  required
                />
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>
            </div>

            {/* Categoria */}
            <div>
              <Label className="text-xs font-bold text-black mb-1 block">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => { setFormData(prev => ({ ...prev, category: value })); setErrors(prev => ({ ...prev, category: '' })); }}>
                <SelectTrigger className={`h-9 bg-white ${errors.category ? 'border-2 border-red-500' : 'border border-[#7578EC]/20'} rounded-lg text-black text-sm`}>
                  <SelectValue placeholder="Scegli categoria" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#7578EC]/20 rounded-lg max-h-48">
                  {sortedCategories.map(category => (
                    <SelectItem key={category.key} value={category.key} className="text-black hover:bg-[#7578EC]/5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
            </div>

            {/* Frequenza e Data addebito */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-black mb-1 block">Frequenza</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value as TransactionFrequencyType }))}>
                  <SelectTrigger className="h-9 bg-white border border-[#7578EC]/20 rounded-lg text-black text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#7578EC]/20 rounded-lg">
                    <SelectItem value="weekly" className="text-black hover:bg-[#7578EC]/5">Settimanale</SelectItem>
                    <SelectItem value="biweekly" className="text-black hover:bg-[#7578EC]/5">Quindicinale</SelectItem>
                    <SelectItem value="monthly" className="text-black hover:bg-[#7578EC]/5">Mensile</SelectItem>
                    <SelectItem value="yearly" className="text-black hover:bg-[#7578EC]/5">Annuale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <Label className="text-xs font-bold text-black mb-1 block">Data addebito</Label>
                <div className="relative w-full">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#7578EC] pointer-events-none z-10" />
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    className="h-9 w-full pl-9 pr-3 bg-white border border-[#7578EC]/20 rounded-lg text-black text-sm [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{ position: 'relative' }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Periodo (inizio/fine) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <Label className="text-xs font-bold text-black mb-1 block">Data inizio</Label>
                <div className="relative w-full">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#7578EC] pointer-events-none z-10" />
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="h-9 w-full pl-9 pr-3 bg-white border border-[#7578EC]/20 rounded-lg text-black text-sm [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{ position: 'relative' }}
                    required
                  />
                </div>
              </div>
              <div className="min-w-0">
                <Label className="text-xs font-bold text-black mb-1 block">Data fine (opzionale)</Label>
                <div className="relative w-full">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#7578EC] pointer-events-none z-10" />
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => { setFormData(prev => ({ ...prev, end_date: e.target.value })); setErrors(prev => ({ ...prev, end_date: '' })); }}
                    className={`h-9 w-full pl-9 pr-3 bg-white ${errors.end_date ? 'border-2 border-red-500' : 'border border-[#7578EC]/20'} rounded-lg text-black text-sm [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                    style={{ position: 'relative' }}
                  />
                </div>
                {errors.end_date && <p className="text-xs text-red-500 mt-1">{errors.end_date}</p>}
              </div>
            </div>

            {/* Conto */}
            <div>
              <Label className="text-xs font-bold text-black mb-1 block">Conto</Label>
              <Select value={formData.account_id} onValueChange={(value) => { setFormData(prev => ({ ...prev, account_id: value })); setErrors(prev => ({ ...prev, account_id: '' })); }}>
                <SelectTrigger className={`h-9 bg-white ${errors.account_id ? 'border-2 border-red-500' : 'border border-[#7578EC]/20'} rounded-lg text-black text-sm`}>
                  <SelectValue placeholder="Scegli conto" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#7578EC]/20 rounded-lg">
                  {userAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id} className="text-black hover:bg-[#7578EC]/5">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3 w-3" />
                        <span className="text-sm">{account.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.account_id && <p className="text-xs text-red-500 mt-1">{errors.account_id}</p>}
            </div>

            {/* Attiva/Disattiva */}
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 accent-[#7578EC]"
              />
              <Label htmlFor="is_active" className="text-xs font-bold text-black">Attiva</Label>
            </div>
          </form>

          {/* Actions */}
          <div className="pt-4 border-t border-[#7578EC]/10">
            <Button
              type="submit"
              onClick={handleSubmit}
              className="w-full h-10 bg-gradient-to-r from-[#7578EC] to-[#669BBC] text-white rounded-lg text-sm font-bold"
              disabled={createSeriesMutation.isPending || updateSeriesMutation.isPending}
            >
              {(createSeriesMutation.isPending || updateSeriesMutation.isPending) ? (
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

export default RecurringSeriesForm;


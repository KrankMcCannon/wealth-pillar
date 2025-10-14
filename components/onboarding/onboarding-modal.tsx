"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Wallet, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OnboardingModalProps {
  onComplete: (data: { groupName: string; accountName: string; initialBalance: number }) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export default function OnboardingModal({ onComplete, loading = false, error = null }: OnboardingModalProps) {
  const [groupName, setGroupName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onComplete({
      groupName: groupName.trim(),
      accountName: accountName.trim(),
      initialBalance: parseFloat(initialBalance) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-6"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Completa il tuo profilo</h2>
          <p className="text-sm text-gray-600">Configura il tuo gruppo e il primo conto</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[hsl(var(--color-primary))]" />
              Nome del gruppo
            </Label>
            <Input
              id="groupName"
              type="text"
              placeholder="es. Famiglia Rossi"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              className="h-10 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20"
              disabled={loading}
            />
            <p className="text-xs text-gray-500">Il nome del tuo gruppo familiare o organizzazione</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName" className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[hsl(var(--color-primary))]" />
              Nome del conto
            </Label>
            <Input
              id="accountName"
              type="text"
              placeholder="es. Conto Corrente Principale"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
              className="h-10 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20"
              disabled={loading}
            />
            <p className="text-xs text-gray-500">Il tuo primo conto bancario o portafoglio</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialBalance" className="text-sm font-medium text-gray-900">
              Saldo iniziale (€)
            </Label>
            <Input
              id="initialBalance"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="h-10 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20"
              disabled={loading}
            />
            <p className="text-xs text-gray-500">Il saldo attuale del tuo conto (opzionale)</p>
          </div>

          <Button
            type="submit"
            disabled={loading || !groupName.trim() || !accountName.trim()}
            className="w-full h-10 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary))]/90 text-white transition-all duration-200 active:scale-[.98] shadow-md text-sm font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configurazione in corso...
              </>
            ) : (
              'Completa configurazione'
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

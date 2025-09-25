"use client";

import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useEmailVerificationController } from '@/hooks/useEmailVerificationController';
import AuthCard from '@/components/auth/auth-card';
import { motion, AnimatePresence } from 'framer-motion';

export default function Page() {
  const { step, code, error, loading, setCode, setStep, requestCode, verifyCode, resend } = useEmailVerificationController();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--color-background))] py-12 px-4 sm:px-6 lg:px-8">
      <AuthCard title="Verifica email" subtitle="Conferma l&apos;indirizzo email per abilitare tutte le funzionalità">
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200 shadow-sm">{error}</div>
        )}

        <AnimatePresence mode="wait">
        {step === 'request' && (
          <motion.form key="req" onSubmit={requestCode} className="space-y-4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <p className="text-sm text-[color:var(--text-secondary)]">Invia un codice di verifica al tuo indirizzo email.</p>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-white transition-all duration-200 hover:opacity-90 active:scale-[.98]">
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Invio codice...</>) : (<><Mail className="mr-2 h-4 w-4" /> Invia codice</>)}
            </Button>
            <div className="text-center text-sm text-[color:var(--text-secondary)]">
              Torna al{' '}
              <Link className="text-[hsl(var(--color-primary))] hover:underline" href="/dashboard">dashboard</Link>
            </div>
          </motion.form>
        )}

        {step === 'verify' && (
          <motion.form key="ver" onSubmit={verifyCode} className="space-y-4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <div className="space-y-2">
              <Label htmlFor="code">Codice di verifica</Label>
              <Input id="code" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('request')}>Torna indietro</Button>
              <div className="flex items-center gap-3">
                <button type="button" className="text-sm text-[hsl(var(--color-primary))] hover:underline" onClick={resend}>Reinvia codice</button>
                <Button type="submit" disabled={loading} className="gradient-primary text-white transition-all duration-200 hover:opacity-90 active:scale-[.98]">
                  {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifica...</>) : 'Verifica' }
                </Button>
              </div>
            </div>
          </motion.form>
        )}
        </AnimatePresence>
      </AuthCard>
    </div>
  );
}

"use client";

import { Loader2, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { usePasswordResetController } from '@/hooks/usePasswordResetController';
import AuthCard from '@/components/auth/auth-card';
import { motion, AnimatePresence } from 'framer-motion';
import PasswordInput from '@/components/auth/password-input';
import PasswordRequirements, { getRequirementsStatus } from '@/components/auth/password-requirements';
import PasswordStrength from '@/components/auth/password-strength';

export default function Page() {
  const { step, email, code, password, error, loading, setEmail, setCode, setPassword, requestCode, verifyCode, submitNewPassword, resendCode, setStep } = usePasswordResetController();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--color-background))] py-12 px-4 sm:px-6 lg:px-8">
      <AuthCard title="Recupera la password" subtitle="Ricevi un codice via email e imposta una nuova password">
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200 shadow-sm">{error}</div>
        )}

        <AnimatePresence mode="wait">
        {step === 'request' && (
          <motion.form key="req" onSubmit={requestCode} className="space-y-4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-secondary)]" />
                <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-9" />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full gradient-primary text-white transition-all duration-200 hover:opacity-90 active:scale-[.98]">
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Invio codice...</>) : 'Invia codice'}
            </Button>

            <div className="text-center text-sm text-[color:var(--text-secondary)]">
              Hai già la password?{' '}
              <Link className="text-[hsl(var(--color-primary))] hover:underline" href="/sign-in">Accedi</Link>
            </div>
          </motion.form>
        )}

        {step === 'verify' && (
          <motion.form key="ver" onSubmit={verifyCode} className="space-y-4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <div className="space-y-2">
              <Label htmlFor="code">Codice ricevuto via email</Label>
              <Input id="code" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('request')}>Torna indietro</Button>
              <div className="flex items-center gap-3">
                <button type="button" className="text-sm text-[hsl(var(--color-primary))] hover:underline" onClick={resendCode}>Reinvia codice</button>
                <Button type="submit" disabled={loading} className="gradient-primary text-white transition-all duration-200 hover:opacity-90 active:scale-[.98]">
                  {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifica...</>) : 'Verifica codice'}
                </Button>
              </div>
            </div>
          </motion.form>
        )}

        {step === 'reset' && (
          <motion.form key="reset" onSubmit={submitNewPassword} className="space-y-4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
            <div className="space-y-2">
              <Label htmlFor="password">Nuova password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-secondary)]" />
                <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-9" />
              </div>
              <PasswordStrength password={password} />
              <PasswordRequirements password={password} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('verify')}>Torna indietro</Button>
              <Button type="submit" disabled={loading || !getRequirementsStatus(password).meetsAll} className="gradient-primary text-white transition-all duration-200 hover:opacity-90 active:scale-[.98]">
                {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvataggio...</>) : 'Salva nuova password'}
              </Button>
            </div>
          </motion.form>
        )}
        </AnimatePresence>
      </AuthCard>
    </div>
  );
}

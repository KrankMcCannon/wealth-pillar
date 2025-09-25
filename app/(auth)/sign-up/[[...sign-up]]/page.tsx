"use client";

import Link from 'next/link';
import { Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleButton, AppleButton, GitHubButton } from '@/components/auth/social-buttons';
import AuthCard from '@/components/auth/auth-card';
import { motion, AnimatePresence } from 'framer-motion';
import PasswordInput from '@/components/auth/password-input';
import PasswordStrength, { scorePassword } from '@/components/auth/password-strength';
import PasswordRequirements, { getRequirementsStatus } from '@/components/auth/password-requirements';
import { useSignUpController } from '@/hooks/useSignUpController';
import EmailSuggestions from '@/components/auth/email-suggestions';

export default function Page() {
  const { step, email, password, firstName, lastName, code, error, loading, setEmail, setPassword, setFirstName, setLastName, setCode, setStep, submitCredentials, submitVerification, resendVerificationCode, oauth } = useSignUpController();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[hsl(var(--color-background))] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(closest-side, hsl(var(--color-primary)) 0%, transparent 65%)' }} />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(closest-side, hsl(var(--color-secondary)) 0%, transparent 65%)' }} />
      <AuthCard title="Crea il tuo account" subtitle="Inizia a gestire le tue finanze con Wealth Pillar">
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200 shadow-sm">{error}</div>
        )}

        <AnimatePresence mode="wait">
        {step === 'credentials' && (
          <motion.form
            key="credentials"
            onSubmit={submitCredentials}
            className="space-y-4"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-secondary)]" />
                  <Input id="firstName" autoComplete="given-name" placeholder="Mario" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome</Label>
                <div className="relative">
                  <Input id="lastName" autoComplete="family-name" placeholder="Rossi" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-secondary)]" />
                <Input id="email" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-9" />
              </div>
              <EmailSuggestions value={email} onSelect={setEmail} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-secondary)]" />
                <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-9" />
              </div>
              <PasswordStrength password={password} />
              <PasswordRequirements password={password} />
            </div>

            <Button type="submit" disabled={loading || scorePassword(password) < 3 || !getRequirementsStatus(password).meetsAll} className="w-full gradient-primary text-white transition-all duration-200 hover:opacity-90 active:scale-[.98]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrazione in corso
                </>
              ) : (
                'Crea account'
              )}
            </Button>

            <div className="flex items-center gap-3 py-2">
              <div className="h-px bg-[hsl(var(--color-border))] flex-1" />
              <span className="text-xs text-[color:var(--text-secondary)]">oppure</span>
              <div className="h-px bg-[hsl(var(--color-border))] flex-1" />
            </div>

            <GoogleButton onClick={oauth.google} className="w-full transition-all duration-200 hover:opacity-90 active:scale-[.98]" />
            <AppleButton onClick={oauth.apple} className="w-full transition-all duration-200 hover:opacity-90 active:scale-[.98]" />
            <GitHubButton onClick={oauth.github} className="w-full transition-all duration-200 hover:opacity-90 active:scale-[.98]" />

            <div className="text-center text-sm text-[color:var(--text-secondary)]">
              Hai già un account?{' '}
              <Link className="text-[hsl(var(--color-primary))] hover:underline" href="/sign-in">
                Accedi
              </Link>
            </div>
          </motion.form>
        )}

        {step === 'verify' && (
          <motion.form
            key="verify"
            onSubmit={submitVerification}
            className="space-y-4"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <p className="text-sm text-[color:var(--text-secondary)]">Abbiamo inviato un codice a {email}. Inseriscilo per completare la registrazione.</p>

            <div className="space-y-2">
              <Label htmlFor="code">Codice di verifica</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
            </div>

            <Button type="submit" disabled={loading} className="w-full gradient-primary text-white transition-all duration-200 hover:opacity-90 active:scale-[.98]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifica in corso
                </>
              ) : (
                'Verifica e completa'
              )}
            </Button>

            <div className="flex items-center justify-between text-sm text-[color:var(--text-secondary)]">
              <button type="button" className="text-[hsl(var(--color-primary))] hover:underline" onClick={() => setStep('credentials')}>
                Torna indietro
              </button>
              <button type="button" className="text-[hsl(var(--color-primary))] hover:underline" onClick={resendVerificationCode}>
                Reinvia codice
              </button>
            </div>
          </motion.form>
        )}
        </AnimatePresence>
      </AuthCard>
    </div>
  );
}

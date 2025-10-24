"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import OnboardingModal from '@/components/shared/onboarding-modal';
import { AppleButton, AuthCard, EmailSuggestions, getRequirementsStatus, GitHubButton, GoogleButton, PasswordInput, PasswordRequirements, PasswordStrength, scorePassword, useSignUpController } from '@/features/auth';
import { Button, Input, Label } from '@/components/ui';

export default function Page() {
  const searchParams = useSearchParams();
  const { step, email, password, firstName, lastName, username, code, error, loading, setEmail, setPassword, setFirstName, setLastName, setUsername, setCode, setStep, submitCredentials, submitVerification, resendVerificationCode, completeOnboarding, oauth } = useSignUpController();

  // Handle OAuth errors from URL params
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'oauth-failed') {
      setOauthError('Errore durante l\'autenticazione social. Riprova o usa email/password.');
    }
  }, [searchParams]);

  return (
    <>
      <div className="pointer-events-none fixed -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-primary))]" />
      <div className="pointer-events-none fixed -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-secondary))]" />

      {step === 'onboarding' && (
        <OnboardingModal
          onComplete={completeOnboarding}
          loading={loading}
          error={error}
        />
      )}

      <AuthCard title="Crea il tuo account" subtitle="Inizia a gestire le tue finanze">
        {(error || oauthError) && (
          <div className="mb-2 rounded-lg bg-red-50 p-2 text-xs text-red-700 border border-red-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error || oauthError}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
        {step === 'credentials' && (
          <motion.form
            key="credentials"
            onSubmit={submitCredentials}
            className="space-y-2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-xs font-medium text-gray-900">Nome</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--color-primary))]/60" />
                  <Input id="firstName" autoComplete="given-name" placeholder="Mario" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-9 h-9 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-xs font-medium text-gray-900">Cognome</Label>
                <div className="relative">
                  <Input id="lastName" autoComplete="family-name" placeholder="Rossi" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-9 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-medium text-gray-900">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--color-primary))]/60" />
                <Input id="email" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-9 h-9 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20" />
              </div>
              <EmailSuggestions value={email} onSelect={setEmail} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="username" className="text-xs font-medium text-gray-900">Username (opzionale)</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--color-primary))]/60" />
                <Input id="username" autoComplete="username" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-9 h-9 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20" />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Se vuoto, useremo la parte prima della @ della tua email</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-medium text-gray-900">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--color-primary))]/60" />
                <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-9 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20" />
              </div>
              <PasswordStrength password={password} />
              <PasswordRequirements password={password} />
            </div>

            <Button type="submit" disabled={loading || scorePassword(password) < 3 || !getRequirementsStatus(password).meetsAll} className="w-full h-9 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary))]/90 text-white transition-all duration-200 active:scale-[.98] shadow-md text-sm font-medium">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Registrazione in corso
                </>
              ) : (
                'Crea account'
              )}
            </Button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px bg-[hsl(var(--color-primary))]/20 flex-1" />
              <span className="text-xs text-gray-500 font-medium">oppure</span>
              <div className="h-px bg-[hsl(var(--color-primary))]/20 flex-1" />
            </div>

            <div className="space-y-1.5">
              <GoogleButton onClick={oauth.google} className="w-full h-9 transition-all duration-200 hover:opacity-95 active:scale-[.98] text-sm" />
              <AppleButton onClick={oauth.apple} className="w-full h-9 transition-all duration-200 hover:opacity-95 active:scale-[.98] text-sm" />
              <GitHubButton onClick={oauth.github} className="w-full h-9 transition-all duration-200 hover:opacity-95 active:scale-[.98] text-sm" />
            </div>

            <div className="text-center text-xs text-gray-600 pt-1">
              Hai già un account?{' '}
              <Link className="text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary))]/80 font-semibold" href="/sign-in">
                Accedi
              </Link>
            </div>
          </motion.form>
        )}

        {step === 'verify' && (
          <motion.form
            key="verify"
            onSubmit={submitVerification}
            className="space-y-3"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <p className="text-xs text-gray-600">Abbiamo inviato un codice a {email}. Inseriscilo per completare la registrazione.</p>

            <div className="space-y-1">
              <Label htmlFor="code" className="text-xs font-medium text-gray-900">Codice di verifica</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className="h-9 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20" />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-9 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary))]/90 text-white transition-all duration-200 active:scale-[.98] shadow-md text-sm font-medium">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Verifica in corso
                </>
              ) : (
                'Verifica e completa'
              )}
            </Button>

            <div className="flex items-center justify-between text-xs text-gray-600">
              <button type="button" className="text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary))]/80 font-medium" onClick={() => setStep('credentials')}>
                Torna indietro
              </button>
              <button type="button" className="text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary))]/80 font-medium" onClick={resendVerificationCode}>
                Reinvia codice
              </button>
            </div>
          </motion.form>
        )}
        </AnimatePresence>
      </AuthCard>
    </>
  );
}

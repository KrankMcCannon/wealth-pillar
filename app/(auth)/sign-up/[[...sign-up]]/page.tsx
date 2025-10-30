"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import OnboardingModal from '@/components/shared/onboarding-modal';
import { AppleButton, AuthCard, EmailSuggestions, getRequirementsStatus, GitHubButton, GoogleButton, PasswordInput, PasswordRequirements, PasswordStrength, scorePassword, useSignUpState, authStyles } from '@/features/auth';
import { Button, Input, Label } from '@/components/ui';

export default function Page() {
  const searchParams = useSearchParams();
  const { state, actions } = useSignUpState();

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
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />

      {state.step === 'onboarding' && (
        <OnboardingModal
          onComplete={actions.completeOnboarding}
          loading={state.loading}
          error={state.error}
        />
      )}

      <AuthCard title="Crea il tuo account" subtitle="Inizia a gestire le tue finanze">
        {(state.error || oauthError) && (
          <div className={authStyles.error.container}>
            <AlertCircle className={authStyles.error.icon} />
            <span className={authStyles.error.text}>{state.error || oauthError}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
        {state.step === 'credentials' && (
          <motion.form
            key="credentials"
            onSubmit={actions.submitCredentials}
            className={authStyles.form.container}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div className={authStyles.form.twoColumnGrid}>
              <div className={authStyles.form.fieldGroup}>
                <Label htmlFor="firstName" className={authStyles.label.base}>Nome</Label>
                <div className={authStyles.input.wrapper}>
                  <UserIcon className={authStyles.input.icon} />
                  <Input id="firstName" autoComplete="given-name" placeholder="Mario" value={state.firstName} onChange={(e) => actions.setFirstName(e.target.value)} className={`${authStyles.input.field} pl-9`} />
                </div>
              </div>
              <div className={authStyles.form.fieldGroup}>
                <Label htmlFor="lastName" className={authStyles.label.base}>Cognome</Label>
                <div className={authStyles.input.wrapper}>
                  <Input id="lastName" autoComplete="family-name" placeholder="Rossi" value={state.lastName} onChange={(e) => actions.setLastName(e.target.value)} className={authStyles.input.field} />
                </div>
              </div>
            </div>

            <div className={authStyles.form.fieldGroup}>
              <Label htmlFor="email" className={authStyles.label.base}>Email</Label>
              <div className={authStyles.input.wrapper}>
                <Mail className={authStyles.input.icon} />
                <Input id="email" type="email" autoComplete="email" placeholder="name@example.com" value={state.email} onChange={(e) => actions.setEmail(e.target.value)} required className={`${authStyles.input.field} pl-9`} />
              </div>
              <EmailSuggestions value={state.email} onSelect={actions.setEmail} />
            </div>

            <div className={authStyles.form.fieldGroup}>
              <Label htmlFor="username" className={authStyles.label.base}>Username (opzionale)</Label>
              <div className={authStyles.input.wrapper}>
                <UserIcon className={authStyles.input.icon} />
                <Input id="username" autoComplete="username" placeholder="username" value={state.username} onChange={(e) => actions.setUsername(e.target.value)} className={`${authStyles.input.field} pl-9`} />
              </div>
              <p className={authStyles.label.base}>Se vuoto, useremo la parte prima della @ della tua email</p>
            </div>

            <div className={authStyles.form.fieldGroup}>
              <Label htmlFor="password" className={authStyles.label.base}>Password</Label>
              <div className={authStyles.input.wrapper}>
                <Lock className={authStyles.input.icon} />
                <PasswordInput id="password" placeholder="••••••••" value={state.password} onChange={(e) => actions.setPassword(e.target.value)} required className={authStyles.password.field} />
              </div>
              <PasswordStrength password={state.password} />
              <PasswordRequirements password={state.password} />
            </div>

            <Button type="submit" disabled={state.loading || scorePassword(state.password) < 3 || !getRequirementsStatus(state.password).meetsAll} className={authStyles.button.primary}>
              {state.loading ? (
                <>
                  <Loader2 className={authStyles.button.icon} />
                  Registrazione in corso
                </>
              ) : (
                'Crea account'
              )}
            </Button>

            <div className={authStyles.divider.container}>
              <div className={authStyles.divider.line} />
              <span className={authStyles.divider.text}>oppure</span>
              <div className={authStyles.divider.line} />
            </div>

            <div className={authStyles.socialButtons.container}>
              <GoogleButton onClick={actions.handleGoogleSignUp} className={authStyles.socialButtons.button} />
              <AppleButton onClick={actions.handleAppleSignUp} className={authStyles.socialButtons.button} />
              <GitHubButton onClick={actions.handleGitHubSignUp} className={authStyles.socialButtons.button} />
            </div>

            <div className={authStyles.toggle.container}>
              Hai già un account?{' '}
              <Link className={authStyles.toggle.link} href="/sign-in">
                Accedi
              </Link>
            </div>
          </motion.form>
        )}

        {state.step === 'verify' && (
          <motion.form
            key="verify"
            onSubmit={actions.submitVerification}
            className={authStyles.verification.container}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <p className={authStyles.verification.infoText}>Abbiamo inviato un codice a {state.email}. Inseriscilo per completare la registrazione.</p>

            <div className={authStyles.form.fieldGroup}>
              <Label htmlFor="code" className={authStyles.label.base}>Codice di verifica</Label>
              <Input id="code" value={state.code} onChange={(e) => actions.setCode(e.target.value)} placeholder="123456" className={authStyles.input.field} />
            </div>

            <Button type="submit" disabled={state.loading} className={authStyles.button.primary}>
              {state.loading ? (
                <>
                  <Loader2 className={authStyles.button.icon} />
                  Verifica in corso
                </>
              ) : (
                'Verifica e completa'
              )}
            </Button>

            <div className={authStyles.verification.actions}>
              <button type="button" className={authStyles.toggle.link} onClick={() => actions.setStep('credentials')}>
                Torna indietro
              </button>
              <button type="button" className={authStyles.toggle.link} onClick={actions.resendVerificationCode}>
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

"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppleButton, AuthCard, GitHubButton, GoogleButton, PasswordInput, useSignInState, authStyles } from '@/features/auth';
import { Button, Input, Label } from '@/components/ui';

export default function Page() {
  const searchParams = useSearchParams();
  const { state, actions } = useSignInState();

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

      <AuthCard title="Accedi al tuo account" subtitle="Gestisci le tue finanze">
        {(state.error || oauthError) && (
          <div className={authStyles.error.container}>
            <AlertCircle className={authStyles.error.icon} />
            <span className={authStyles.error.text}>{state.error || oauthError}</span>
          </div>
        )}

        <form onSubmit={actions.handleSubmit} className={authStyles.form.container}>

          <div className={authStyles.form.fieldGroup}>
            <Label htmlFor="email" className={authStyles.label.base}>Email</Label>
            <div className={authStyles.input.wrapper}>
              <Mail className={authStyles.input.icon} />
              <Input id="email" type="email" placeholder="name@example.com" value={state.email} onChange={(e) => actions.setEmail(e.target.value)} required className={authStyles.input.field} />
            </div>
          </div>
          <div className={authStyles.form.fieldGroup}>
            <Label htmlFor="password" className={authStyles.label.base}>Password</Label>
            <div className={authStyles.input.wrapper}>
              <Lock className={authStyles.input.icon} />
              <PasswordInput id="password" placeholder="••••••••" value={state.password} onChange={(e) => actions.setPassword(e.target.value)} required className={authStyles.password.field} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className={authStyles.checkbox.label}>
              <input type="checkbox" className={authStyles.checkbox.input} />
              Ricordami
            </label>
            <Link href="/forgot-password" className={authStyles.forgotPassword.link}>Password dimenticata?</Link>
          </div>

          <Button type="submit" disabled={state.loading} className={authStyles.button.primary}>
            {state.loading ? (
              <>
                <Loader2 className={authStyles.button.icon} />
                Accesso in corso
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-3.5 w-3.5" />
                Accedi
              </>
            )}
          </Button>

          <div className={authStyles.divider.container}>
            <div className={authStyles.divider.line} />
            <span className={authStyles.divider.text}>oppure</span>
            <div className={authStyles.divider.line} />
          </div>

          <div className={authStyles.socialButtons.container}>
            <GoogleButton onClick={actions.handleGoogleSignIn} className={authStyles.socialButtons.button} />
            <AppleButton onClick={actions.handleAppleSignIn} className={authStyles.socialButtons.button} />
            <GitHubButton onClick={actions.handleGitHubSignIn} className={authStyles.socialButtons.button} />
          </div>

          <div className={authStyles.toggle.container}>
            Non hai un account?{' '}
            <Link className={authStyles.toggle.link} href="/sign-up">
              Registrati
            </Link>
          </div>
        </form>
      </AuthCard>
    </>
  );
}

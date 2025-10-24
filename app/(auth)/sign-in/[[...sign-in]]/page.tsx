"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppleButton, AuthCard, GitHubButton, GoogleButton, PasswordInput, useSignInController } from '@/features/auth';
import { Button, Input, Label } from '@/components/ui';

export default function Page() {
  const searchParams = useSearchParams();
  const { email, password, error, loading, setEmail, setPassword, handleSubmit, oauth } = useSignInController();

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

      <AuthCard title="Accedi al tuo account" subtitle="Gestisci le tue finanze">
        {(error || oauthError) && (
          <div className="mb-2 rounded-lg bg-red-50 p-2 text-xs text-red-700 border border-red-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error || oauthError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">

          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-medium text-gray-900">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--color-primary))]/60" />
              <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-9 h-9 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs font-medium text-gray-900">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--color-primary))]/60" />
              <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-9 text-sm bg-white border-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
              <input type="checkbox" className="size-3 rounded border-[hsl(var(--color-primary))]/30 text-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]/20 align-middle" />
              Ricordami
            </label>
            <Link href="/forgot-password" className="text-xs text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary))]/80 font-medium">Password dimenticata?</Link>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-9 bg-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary))]/90 text-white transition-all duration-200 active:scale-[.98] shadow-md text-sm font-medium">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Accesso in corso
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-3.5 w-3.5" />
                Accedi
              </>
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
            Non hai un account?{' '}
            <Link className="text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary))]/80 font-semibold" href="/sign-up">
              Registrati
            </Link>
          </div>
        </form>
      </AuthCard>
    </>
  );
}

"use client";

import Link from 'next/link';
import { Loader2, Mail, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleButton, AppleButton, GitHubButton } from '@/components/auth/social-buttons';
import { useSignInController } from '@/hooks/useSignInController';
import AuthCard from '@/components/auth/auth-card';
import PasswordInput from '@/components/auth/password-input';

export default function Page() {
  const { email, password, error, loading, setEmail, setPassword, handleSubmit, oauth } = useSignInController();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[hsl(var(--color-background))] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(closest-side, hsl(var(--color-primary)) 0%, transparent 65%)' }} />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(closest-side, hsl(var(--color-secondary)) 0%, transparent 65%)' }} />
      <AuthCard title="Accedi al tuo account" subtitle="Gestisci le tue finanze con Wealth Pillar">
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200 shadow-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-secondary)]" />
              <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-secondary)]" />
              <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-9" />
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="inline-flex items-center gap-2 text-xs text-[color:var(--text-secondary)] cursor-pointer select-none">
              <input type="checkbox" className="size-4 rounded border-[hsl(var(--color-border))] align-middle" />
              Ricordami
            </label>
            <Link href="/forgot-password" className="text-xs text-[hsl(var(--color-primary))] hover:underline">Password dimenticata?</Link>
          </div>

          <Button type="submit" disabled={loading} className="w-full gradient-primary text-white transition-all duration-200 hover:opacity-90 active:scale-[.98]">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accesso in corso
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Accedi
              </>
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
            Non hai un account?{' '}
            <Link className="text-[hsl(var(--color-primary))] hover:underline" href="/sign-up">
              Registrati
            </Link>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}

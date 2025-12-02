"use client";

import { Loader2 } from "lucide-react";
import { AuthCard } from "@/features/auth";

/**
 * SSO Callback Page for Sign Up
 * Handles OAuth redirects from providers (Google, Apple, GitHub)
 * Stays within app layout instead of redirecting to Clerk's hosted pages
 */
export default function SignUpSSOCallback() {
  return (
    <>
      <div className="pointer-events-none fixed -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-primary))]" />
      <div className="pointer-events-none fixed -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-secondary))]" />
      <AuthCard title="Registrazione in corso" subtitle="Completamento autenticazione">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[hsl(var(--color-primary))]" />
          <p className="text-sm text-gray-600 text-center">Stiamo completando la tua registrazione...</p>
        </div>
      </AuthCard>
    </>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { AppleButton, AuthCard, GitHubButton, GoogleButton, PasswordInput, authStyles } from "@/features/auth";
import { Button, Input, Label } from "@/components/ui";

export default function Page() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "oauth-failed") {
    }
  }, [searchParams]);

  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />

      <AuthCard title="Accedi al tuo account" subtitle="Gestisci le tue finanze">
        {false && (
          <div className={authStyles.error.container}>
            <AlertCircle className={authStyles.error.icon} />
            <span className={authStyles.error.text}>{false}</span>
          </div>
        )}

        <form onSubmit={() => {}} className={authStyles.form.container}>
          <div className={authStyles.form.fieldGroup}>
            <Label htmlFor="email" className={authStyles.label.base}>
              Email
            </Label>
            <div className={authStyles.input.wrapper}>
              <Mail className={authStyles.input.icon} />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={""}
                onChange={() => {}}
                required
                className={authStyles.input.field}
              />
            </div>
          </div>
          <div className={authStyles.form.fieldGroup}>
            <Label htmlFor="password" className={authStyles.label.base}>
              Password
            </Label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              value={""}
              onChange={() => {}}
              required
              icon={<Lock className="h-3.5 w-3.5" />}
            />
          </div>

          <div className={authStyles.actions.row}>
            <label className={authStyles.checkbox.label}>
              <input type="checkbox" className={authStyles.checkbox.input} /> Ricordami
            </label>
            <Link href="/forgot-password" className={authStyles.forgotPassword.link}>
              Password dimenticata?
            </Link>
          </div>

          <Button type="submit" disabled={false} className={authStyles.button.primary}>
            {false ? (
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
            <GoogleButton onClick={() => {}} className={authStyles.socialButtons.button} />
            <AppleButton onClick={() => {}} className={authStyles.socialButtons.button} />
            <GitHubButton onClick={() => {}} className={authStyles.socialButtons.button} />
          </div>

          <div className={authStyles.toggle.container}>
            Non hai un account?{" "}
            <Link className={authStyles.toggle.link} href="/sign-up">
              Registrati
            </Link>
          </div>
        </form>
      </AuthCard>
    </>
  );
}

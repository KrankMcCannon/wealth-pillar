"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock, User as UserIcon, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import OnboardingModal from "@/components/shared/onboarding-modal";
import {
  AppleButton,
  AuthCard,
  EmailSuggestions,
  getRequirementsStatus,
  GitHubButton,
  GoogleButton,
  PasswordInput,
  PasswordRequirements,
  PasswordStrength,
  scorePassword,
  authStyles,
} from "@/features/auth";
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

      {false && <OnboardingModal onComplete={async () => {}} loading={false} error={null} />}

      <AuthCard title="Crea il tuo account" subtitle="Inizia a gestire le tue finanze">
        {false && (
          <div className={authStyles.error.container}>
            <AlertCircle className={authStyles.error.icon} />
            <span className={authStyles.error.text}>{false}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {false && (
            <motion.form
              key="credentials"
              onSubmit={() => {}}
              className={authStyles.form.container}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className={authStyles.form.twoColumnGrid}>
                <div className={authStyles.form.fieldGroup}>
                  <Label htmlFor="firstName" className={authStyles.label.base}>
                    Nome
                  </Label>
                  <div className={authStyles.input.wrapper}>
                    <UserIcon className={authStyles.input.icon} />
                    <Input
                      id="firstName"
                      autoComplete="given-name"
                      placeholder="Mario"
                      value={""}
                      onChange={() => {}}
                      className={`${authStyles.input.field} pl-9`}
                    />
                  </div>
                </div>
                <div className={authStyles.form.fieldGroup}>
                  <Label htmlFor="lastName" className={authStyles.label.base}>
                    Cognome
                  </Label>
                  <div className={authStyles.input.wrapper}>
                    <Input
                      id="lastName"
                      autoComplete="family-name"
                      placeholder="Rossi"
                      value={""}
                      onChange={() => {}}
                      className={authStyles.input.field}
                    />
                  </div>
                </div>
              </div>

              <div className={authStyles.form.fieldGroup}>
                <Label htmlFor="email" className={authStyles.label.base}>
                  Email
                </Label>
                <div className={authStyles.input.wrapper}>
                  <Mail className={authStyles.input.icon} />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={""}
                    onChange={() => {}}
                    required
                    className={`${authStyles.input.field} pl-9`}
                  />
                </div>
                <EmailSuggestions value={""} onSelect={() => {}} />
              </div>

              <div className={authStyles.form.fieldGroup}>
                <Label htmlFor="username" className={authStyles.label.base}>
                  Username (opzionale)
                </Label>
                <div className={authStyles.input.wrapper}>
                  <UserIcon className={authStyles.input.icon} />
                  <Input
                    id="username"
                    autoComplete="username"
                    placeholder="username"
                    value={""}
                    onChange={() => {}}
                    className={`${authStyles.input.field} pl-9`}
                  />
                </div>
                <p className={authStyles.label.base}>Se vuoto, useremo la parte prima della @ della tua email</p>
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
                <PasswordStrength password={""} />
                <PasswordRequirements password={""} />
              </div>

              <Button
                type="submit"
                disabled={false || scorePassword("") < 3 || !getRequirementsStatus("").meetsAll}
                className={authStyles.button.primary}
              >
                {false ? (
                  <>
                    <Loader2 className={authStyles.button.icon} />
                    Registrazione in corso
                  </>
                ) : (
                  "Crea account"
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
                Hai già un account?{" "}
                <Link className={authStyles.toggle.link} href="/sign-in">
                  Accedi
                </Link>
              </div>
            </motion.form>
          )}

          {false && (
            <motion.form
              key="verify"
              onSubmit={() => {}}
              className={authStyles.verification.container}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <p className={authStyles.verification.infoText}>
                Abbiamo inviato un codice a {"email@example.com"}. Inseriscilo per completare la registrazione.
              </p>

              <div className={authStyles.form.fieldGroup}>
                <Label htmlFor="code" className={authStyles.label.base}>
                  Codice di verifica
                </Label>
                <Input
                  id="code"
                  value={""}
                  onChange={() => {}}
                  placeholder="123456"
                  className={authStyles.input.field}
                />
              </div>

              <Button type="submit" disabled={false} className={authStyles.button.primary}>
                {false ? (
                  <>
                    <Loader2 className={authStyles.button.icon} />
                    Verifica in corso
                  </>
                ) : (
                  "Verifica e completa"
                )}
              </Button>

              <div className={authStyles.verification.actions}>
                <button type="button" className={authStyles.toggle.link} onClick={() => {}}>
                  Torna indietro
                </button>
                <button type="button" className={authStyles.toggle.link} onClick={() => {}}>
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

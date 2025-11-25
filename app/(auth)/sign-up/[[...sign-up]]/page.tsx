"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock, User as UserIcon, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useSignUp, useClerk } from "@clerk/nextjs";
import OnboardingModal from "@/components/shared/onboarding-modal";
import ErrorBoundary from "@/components/shared/error-boundary";
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
import { getAllCategoriesAction } from "@/features/categories/actions/category-actions";
import { completeOnboardingAction, deleteClerkUserAction } from "@/features/onboarding/actions";
import type { Category } from "@/lib/types";
import type { OnboardingPayload } from "@/features/onboarding/types";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { signOut, session } = useClerk();

  const [step, setStep] = useState<"credentials" | "verify">("credentials");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [clerkUserId, setClerkUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(true);

  useEffect(() => {
    // Clear any existing session when landing on sign-up page
    if (session) {
      void signOut();
    }
  }, [session, signOut]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "oauth-failed") {
      setErrorMessage("Autenticazione social non riuscita. Riprova oppure utilizza un'altra opzione.");
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      const result = await getAllCategoriesAction();
      if (!result.error && result.data) {
        setCategories(result.data);
      } else if (result.error) {
        setOnboardingError(result.error);
      }
      setCategoriesLoading(false);
    };

    if (showOnboarding && categories.length === 0 && !categoriesLoading) {
      void fetchCategories();
    }
  }, [showOnboarding, categories.length, categoriesLoading]);

  const passwordScore = scorePassword(formData.password);
  const passwordRequirementsMet = getRequirementsStatus(formData.password).meetsAll;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'email') {
      setShowEmailSuggestions(true);
    }
  };

  const handleEmailBlur = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(formData.email)) {
      setShowEmailSuggestions(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isLoaded) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username || undefined,
      });

      // Using email_code strategy (email_link requires additional Clerk Dashboard configuration)
      // For testing in development, use emails with +clerk_test suffix (e.g., user+clerk_test@example.com)
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code"
      });
      setStep("verify");
    } catch (err) {
      console.error("Sign up error:", err);
      const error = err as { errors?: Array<{ message: string }> };
      setErrorMessage(error.errors?.[0]?.message || "Registrazione non riuscita. Riprova.");
      setFormData((prev) => ({ ...prev, password: "" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isLoaded) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setClerkUserId(result.createdUserId || signUp.createdUserId || null);
        setShowOnboarding(true);
      } else {
        setErrorMessage("Codice di verifica non valido.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      const error = err as { errors?: Array<{ message: string }> };
      setErrorMessage(error.errors?.[0]?.message || "Codice di verifica non valido.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch (err) {
      console.error("Resend code error:", err);
    }
  };

  const handleOnboardingComplete = async (payload: OnboardingPayload) => {
    if (!clerkUserId) {
      setOnboardingError("Impossibile identificare l'utente appena creato. Prova a effettuare nuovamente l'accesso.");
      return;
    }

    setOnboardingLoading(true);
    setOnboardingError(null);

    try {
      const result = await completeOnboardingAction({
        user: {
          clerkId: clerkUserId,
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`.trim() || formData.email,
        },
        group: payload.group,
        accounts: payload.accounts,
        budgets: payload.budgets,
      });

      setOnboardingLoading(false);

      if (result.error) {
        // Rollback: Delete the Clerk user if Supabase save failed
        console.error("Onboarding failed, rolling back Clerk user...");
        setOnboardingError(
          `${result.error}. La registrazione verrà annullata. Riprova tra poco.`
        );

        // Delete Clerk user and clean up the session
        try {
          // First delete the Clerk user
          const deleteResult = await deleteClerkUserAction(clerkUserId);
          if (deleteResult.error) {
            console.error("Failed to delete Clerk user:", deleteResult.error);
          }

          // Then sign out to clear the session
          await signOut();

          // Reset to credentials step so user can try again
          setShowOnboarding(false);
          setStep("credentials");
          setErrorMessage(
            "Registrazione non completata. I tuoi dati non sono stati salvati. Riprova."
          );
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
          setOnboardingError(
            "Errore durante la pulizia. Ricarica la pagina e riprova."
          );
        }
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Unexpected onboarding error:", error);
      setOnboardingLoading(false);
      setOnboardingError(
        "Errore imprevisto durante la configurazione. Riprova tra poco."
      );

      // Attempt cleanup - delete Clerk user
      try {
        const deleteResult = await deleteClerkUserAction(clerkUserId);
        if (deleteResult.error) {
          console.error("Failed to delete Clerk user:", deleteResult.error);
        }
        await signOut();
        setShowOnboarding(false);
        setStep("credentials");
        setErrorMessage(
          "Registrazione non completata. I tuoi dati non sono stati salvati. Riprova."
        );
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }
  };

  const handleOAuthSignUp = async (provider: "oauth_google" | "oauth_apple" | "oauth_github") => {
    if (!isLoaded) return;
    setErrorMessage(null);
    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sign-up/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      const error = err as { errors?: Array<{ message: string }> };
      setErrorMessage(error.errors?.[0]?.message || "Errore durante l'autenticazione social");
    }
  };

  return (
    <ErrorBoundary>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />

      {showOnboarding && (
        <OnboardingModal
          categories={categories}
          categoriesLoading={categoriesLoading}
          loading={onboardingLoading}
          error={onboardingError}
          onComplete={handleOnboardingComplete}
        />
      )}

      <AuthCard title="Crea il tuo account" subtitle="Inizia a gestire le tue finanze">
        {errorMessage && (
          <div className={authStyles.error.container}>
            <AlertCircle className={authStyles.error.icon} />
            <span className={authStyles.error.text}>{errorMessage}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "credentials" && (
            <motion.form
              key="credentials"
              onSubmit={handleRegister}
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
                      value={formData.firstName}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                      className={authStyles.input.field}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className={authStyles.form.fieldGroup}>
                  <Label htmlFor="lastName" className={authStyles.label.base}>
                    Cognome
                  </Label>
                  <div className={authStyles.input.wrapper}>
                    <UserIcon className={authStyles.input.icon} />
                    <Input
                      id="lastName"
                      autoComplete="family-name"
                      placeholder="Rossi"
                      value={formData.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      className={authStyles.input.field}
                      disabled={isSubmitting}
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
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={handleEmailBlur}
                    onFocus={() => setShowEmailSuggestions(true)}
                    required
                    disabled={isSubmitting}
                    className={authStyles.input.field}
                  />
                </div>
                {showEmailSuggestions && (
                  <EmailSuggestions value={formData.email} onSelect={(value) => handleChange("email", value)} />
                )}
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
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    className={authStyles.input.field}
                    disabled={isSubmitting}
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
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                  disabled={isSubmitting}
                  icon={<Lock className="h-3.5 w-3.5" />}
                />
                <PasswordStrength password={formData.password} />
                <PasswordRequirements password={formData.password} />
              </div>

              <Button
                type="submit"
                disabled={
                  isSubmitting || !formData.email || !formData.password || passwordScore < 3 || !passwordRequirementsMet
                }
                className={authStyles.button.primary}
              >
                {isSubmitting ? (
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
                <GoogleButton
                  onClick={() => handleOAuthSignUp("oauth_google")}
                  disabled={!isLoaded}
                  className={authStyles.socialButtons.button}
                />
                <AppleButton
                  onClick={() => handleOAuthSignUp("oauth_apple")}
                  disabled={!isLoaded}
                  className={authStyles.socialButtons.button}
                />
                <GitHubButton
                  onClick={() => handleOAuthSignUp("oauth_github")}
                  disabled={!isLoaded}
                  className={authStyles.socialButtons.button}
                />
              </div>

              <div className={authStyles.toggle.container}>
                Hai già un account?{" "}
                <Link className={authStyles.toggle.link} href="/sign-in">
                  Accedi
                </Link>
              </div>
            </motion.form>
          )}

          {step === "verify" && (
            <motion.form
              key="verify"
              onSubmit={handleVerify}
              className={authStyles.verification.container}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <p className={authStyles.verification.infoText}>
                Abbiamo inviato un codice a {formData.email}. Inseriscilo per completare la registrazione.
              </p>

              <div className={authStyles.form.fieldGroup}>
                <Label htmlFor="code" className={authStyles.label.base}>
                  Codice di verifica
                </Label>
                <Input
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  className={authStyles.input.field}
                  disabled={isVerifying}
                />
              </div>

              <Button
                type="submit"
                disabled={isVerifying || verificationCode.length < 6}
                className={authStyles.button.primary}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className={authStyles.button.icon} />
                    Verifica in corso
                  </>
                ) : (
                  "Verifica e completa"
                )}
              </Button>

              <div className={authStyles.verification.actions}>
                <button type="button" className={authStyles.toggle.link} onClick={() => setStep("credentials")}>
                  Torna indietro
                </button>
                <button
                  type="button"
                  className={authStyles.toggle.link}
                  onClick={handleResendCode}
                  disabled={isVerifying}
                >
                  Reinvia codice
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </AuthCard>
    </ErrorBoundary>
  );
}

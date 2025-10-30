/**
 * Auth Feature - Public API
 * Organized exports for components, hooks, services, and theme
 */

// Components
export * from "./components/auth-guard";
export * from "./components/auth-card";
export * from "./components/user-button";
export * from "./components/auth-method-toggle";
export * from "./components/password-input";
export * from "./components/password-strength";
export * from "./components/password-requirements";
export * from "./components/email-suggestions";
export * from "./components/social-buttons";
export * from "./components/auth-skeletons";

// Hooks - New split state/actions pattern
export { useSignInState } from "./hooks/useSignInState";
export type { SignInFormState, SignInFormActions, SignInStateReturn } from "./hooks/useSignInState";

export { useSignUpState } from "./hooks/useSignUpState";
export type { SignUpFormState, SignUpFormActions, SignUpStateReturn, SignUpStep } from "./hooks/useSignUpState";

export { usePasswordResetState } from "./hooks/usePasswordResetState";
export type { ResetPasswordFormState, ResetPasswordFormActions, ResetPasswordStateReturn, ResetPasswordStep } from "./hooks/usePasswordResetState";

export { useEmailVerificationState } from "./hooks/useEmailVerificationState";
export type { EmailVerificationFormState, EmailVerificationFormActions, EmailVerificationStateReturn, VerificationStep } from "./hooks/useEmailVerificationState";

// Hooks - Other auth utilities
export * from "./hooks/use-auth";

// Services and view models
export * from "./services";

// Theme
export * from "./theme";

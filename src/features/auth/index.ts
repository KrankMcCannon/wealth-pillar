/**
 * Auth Feature - Public API
 * Organized exports for components, hooks, services, and theme
 */

// Components
export * from "./components/auth-card";
export * from "./components/user-button";
export * from "./components/email-suggestions";
export * from "./components/social-buttons";
export * from "./components/auth-skeletons";

// Password components - re-exported from UI for backwards compatibility
export { PasswordInput } from "@/components/ui/password-input";
export { PasswordStrength, scorePassword } from "@/components/ui/password-strength";
export { PasswordRequirements, getRequirementsStatus } from "@/components/ui/password-requirements";
export * from "./theme";

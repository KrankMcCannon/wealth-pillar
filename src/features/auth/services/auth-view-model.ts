/**
 * Auth View Model
 * Transforms raw auth state into ready-for-UI structured data
 * Follows MVVM pattern - separates auth logic from presentation
 */

/**
 * Sign-in form display model
 */
export interface SignInViewModel {
  isFormValid: boolean;
  isSubmitting: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Sign-up form display model
 */
export interface SignUpViewModel {
  isOnCredentialsStep: boolean;
  isOnVerifyStep: boolean;
  isOnboardingStep: boolean;
  isCredentialsFormValid: boolean;
  isVerificationCodeValid: boolean;
  isSubmitting: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * OAuth provider state
 */
export interface OAuthProvider {
  isAvailable: boolean;
  isLoading: boolean;
  name: 'Google' | 'Apple' | 'GitHub';
}

/**
 * Create sign-in view model
 * Computes derived state for sign-in page
 */
export function createSignInViewModel(
  email: string,
  password: string,
  error: string | null,
  loading: boolean
): SignInViewModel {
  return {
    isFormValid: email.length > 0 && password.length > 0,
    isSubmitting: loading,
    hasError: error !== null,
    errorMessage: error,
  };
}

/**
 * Create sign-up view model
 * Computes derived state for sign-up page
 */
export function createSignUpViewModel(
  step: 'credentials' | 'verify' | 'onboarding',
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  code: string,
  error: string | null,
  loading: boolean
): SignUpViewModel {
  const isCredentialsValid =
    email.length > 0 &&
    password.length >= 8 &&
    (firstName.length > 0 || lastName.length > 0);

  const isVerificationCodeValid = code.length === 6;

  return {
    isOnCredentialsStep: step === 'credentials',
    isOnVerifyStep: step === 'verify',
    isOnboardingStep: step === 'onboarding',
    isCredentialsFormValid: isCredentialsValid,
    isVerificationCodeValid: isVerificationCodeValid,
    isSubmitting: loading,
    hasError: error !== null,
    errorMessage: error,
  };
}

/**
 * Create empty sign-in view model
 */
export function createEmptySignInViewModel(): SignInViewModel {
  return {
    isFormValid: false,
    isSubmitting: false,
    hasError: false,
    errorMessage: null,
  };
}

/**
 * Create empty sign-up view model
 */
export function createEmptySignUpViewModel(): SignUpViewModel {
  return {
    isOnCredentialsStep: true,
    isOnVerifyStep: false,
    isOnboardingStep: false,
    isCredentialsFormValid: false,
    isVerificationCodeValid: false,
    isSubmitting: false,
    hasError: false,
    errorMessage: null,
  };
}

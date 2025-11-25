import type { AccountType, BudgetType } from '@/lib/types';

/**
 * Onboarding group information collected from the wizard
 */
export interface OnboardingGroupInput {
  name: string;
  description?: string;
}

/**
 * Onboarding account information for the wizard
 */
export interface OnboardingAccountInput {
  name: string;
  type: AccountType;
}

/**
 * Onboarding budget information for the wizard
 */
export interface OnboardingBudgetInput {
  description: string;
  amount: number;
  type: BudgetType;
  categories: string[];
}

/**
 * Complete onboarding payload sent to the server action
 */
export interface CompleteOnboardingInput {
  user: {
    name: string;
    email: string;
    clerkId: string;
  };
  group: OnboardingGroupInput;
  accounts: OnboardingAccountInput[];
  budgets: OnboardingBudgetInput[];
}

/**
 * Client-side payload sent from the modal to the sign-up page
 */
export interface OnboardingPayload {
  group: OnboardingGroupInput;
  accounts: OnboardingAccountInput[];
  budgets: OnboardingBudgetInput[];
}

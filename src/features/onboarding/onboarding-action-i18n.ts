import { getTranslations } from 'next-intl/server';
import { resolveActionLocale } from '@/i18n/action-locale';

/** Traduzioni namespace `Onboarding.Actions` per server action onboarding (locale validata). */
export async function getOnboardingActionTranslations(locale?: string) {
  const resolved = resolveActionLocale(locale);
  return getTranslations({ locale: resolved, namespace: 'Onboarding.Actions' });
}

export type OnboardingActionTranslator = Awaited<
  ReturnType<typeof getOnboardingActionTranslations>
>;

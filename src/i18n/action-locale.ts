import { hasLocale } from 'next-intl';
import { routing, type AppLocale } from '@/i18n/routing';

/**
 * Risolve la lingua per server action / messaggi utente.
 * Accetta solo valori in `routing.locales`; ignora input non validi (sicurezza + UX).
 */
export function resolveActionLocale(locale: string | undefined): AppLocale {
  if (locale && hasLocale(routing.locales, locale)) {
    return locale;
  }
  return routing.defaultLocale;
}

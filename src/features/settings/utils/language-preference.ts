export function getLanguagePreferenceForLocale(
  locale: string,
  storedLanguage?: string | null
): string {
  const normalizedLocale = locale.toLowerCase();
  const normalizedStoredLanguage = storedLanguage?.toLowerCase();

  if (normalizedLocale === 'it' || normalizedLocale.startsWith('it-')) {
    return 'it-IT';
  }

  if (normalizedLocale === 'en' || normalizedLocale.startsWith('en-')) {
    return 'en-US';
  }

  if (normalizedStoredLanguage === 'it' || normalizedStoredLanguage?.startsWith('it-')) {
    return 'it-IT';
  }

  if (normalizedStoredLanguage === 'en' || normalizedStoredLanguage?.startsWith('en-')) {
    return 'en-US';
  }

  return 'it-IT';
}

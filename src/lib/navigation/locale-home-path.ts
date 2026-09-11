/** `/it` and `/en` are bounce routes; send them to home before the locale layout runs. */
export function localeRootToHomePath(pathname: string, locales: readonly string[]): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length !== 1) return null;
  const locale = segments[0];
  if (!locale || !locales.includes(locale)) return null;
  return `/${locale}/home`;
}

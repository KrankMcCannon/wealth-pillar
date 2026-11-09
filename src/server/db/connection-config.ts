/** Validate without ever including credentials in errors. No endpoint rewriting. */
export function validateDatabaseUrl(value: string, name = 'DATABASE_URL'): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a PostgreSQL URL`);
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !url.hostname ||
    url.pathname === '/'
  ) {
    throw new Error(`${name} must identify a PostgreSQL database`);
  }
  if (/YOUR-PASSWORD/i.test(value)) throw new Error(`${name} contains a password placeholder`);
  if (url.port === '6543' || /(^|\.)pooler\.supabase\.com$/i.test(url.hostname)) {
    throw new Error(`${name} must use the provider-supplied direct endpoint, not a pooler`);
  }
  if (url.searchParams.get('host') || url.searchParams.get('port')) {
    throw new Error(`${name} must specify host and port only in the URL authority`);
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!local && ['disable', 'allow', 'prefer'].includes(url.searchParams.get('sslmode') ?? '')) {
    throw new Error(`${name} must require TLS for remote connections`);
  }
  return url;
}

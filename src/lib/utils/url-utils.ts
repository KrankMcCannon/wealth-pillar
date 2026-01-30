/**
 * URL Utilities for environment-aware absolute URL construction
 */

/**
 * Get the base application URL based on environment
 *
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (explicitly set in environment)
 * 2. window.location.origin (client-side fallback)
 * 3. http://localhost:3000 (server-side development fallback)
 *
 * @returns The base URL without trailing slash
 */
export function getBaseUrl(): string {
  // Priority 1: Explicit environment variable
  if (typeof process.env.NEXT_PUBLIC_APP_URL === 'string' && process.env.NEXT_PUBLIC_APP_URL.length > 0) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ''); // Remove trailing slash
  }

  // Priority 2: Client-side origin (browser environment)
  if (globalThis.window !== undefined) {
    return globalThis.location.origin;
  }

  // Priority 3: Development fallback (server-side)
  return 'http://localhost:3000';
}

/**
 * Construct an absolute URL from a relative path
 *
 * @param path - Relative path (must start with /)
 * @returns Absolute URL
 *
 * @example
 * getAbsoluteUrl('/auth/sso-callback')
 * // => 'https://app.netlify.app/auth/sso-callback'
 */
export function getAbsoluteUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error('Path must start with /');
  }

  return `${getBaseUrl()}${path}`;
}

/**
 * Check if running in production environment
 *
 * @returns true if NODE_ENV is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development environment
 *
 * @returns true if NODE_ENV is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

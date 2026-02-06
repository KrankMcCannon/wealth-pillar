import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'it'],

  // Used when no locale matches
  defaultLocale: 'it',

  // Keep locale prefix explicit for every locale (e.g. '/it/home', '/en/home')
  localePrefix: 'always',

  // Prefix for default locale (optional, but good for consistency)
  // as-needed means if default locale is 'it', /about is acceptable instead of /it/about
  // usually distinct prefixes for all is cleaner for consistency, or 'as-needed' for clean URLs for default.
  // user requested: "Insert a flag for each language", implying clear distinction.
  // let's stick to default implicit prefix handling which is 'always' except maybe for default if configured.
  // 'as-needed' is common default.
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

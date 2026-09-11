import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './src/i18n/routing';
import { localeRootToHomePath } from './src/lib/navigation/locale-home-path';

const handleI18nRouting = createMiddleware(routing);

const isPublicRoute = createRouteMatcher([
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  // Allow root path for redirection
  '/',
]);

/**
 * Dashboard routes that require authentication.
 * Clerk enforces this at the edge — pages still have a redirect fallback
 * via requirePageAuth(), providing defence-in-depth.
 */
const isProtectedDashboardRoute = createRouteMatcher([
  '/:locale/home(.*)',
  '/:locale/accounts(.*)',
  '/:locale/transactions(.*)',
  '/:locale/budgets(.*)',
  '/:locale/investments(.*)',
  '/:locale/reports(.*)',
  '/:locale/settings(.*)',
]);

/** Onboarding richiede sessione Clerk ma non ancora il profilo DB. */
const isOnboardingRoute = createRouteMatcher(['/:locale/onboarding(.*)', '/onboarding(.*)']);

const CLERK_NETLIFY_VARY =
  'cookie=__session,cookie=__client_uat,cookie=__clerk_db_jwt,query=__clerk_netlify_cache_bust';

function withClerkNetlifyVary(response: NextResponse): NextResponse {
  const current = response.headers.get('Netlify-Vary');
  if (current?.includes('cookie=__session')) return response;
  response.headers.set('Netlify-Vary', current ? `${current},${CLERK_NETLIFY_VARY}` : CLERK_NETLIFY_VARY);
  return response;
}

const isServerActionRequest = (request: Request) =>
  request.method === 'POST' && Boolean(request.headers.get('next-action'));

const isApiOrTrpcRequest = (pathname: string) =>
  pathname === '/api' ||
  pathname.startsWith('/api/') ||
  pathname === '/trpc' ||
  pathname.startsWith('/trpc/');

const clerkProxy = clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;
  const homePath = localeRootToHomePath(pathname, routing.locales);
  if (homePath) {
    const url = request.nextUrl.clone();
    url.pathname = homePath;
    return withClerkNetlifyVary(NextResponse.redirect(url));
  }

  const isServerAction = isServerActionRequest(request);

  const shouldProtect =
    !isPublicRoute(request) &&
    (isApiOrTrpcRequest(pathname) ||
      isProtectedDashboardRoute(request) ||
      isOnboardingRoute(request));

  if (shouldProtect) {
    await auth.protect();
  }

  // Skip locale redirects for Server Action requests only.
  // Other RSC/page requests still need next-intl middleware for locale routing.
  if (isServerAction) {
    return withClerkNetlifyVary(NextResponse.next());
  }

  return withClerkNetlifyVary(handleI18nRouting(request));
});

export default clerkProxy;

/** Alias esplicito per convenzione Next.js 16 (`proxy.ts` + export `proxy`). */
export const proxy = clerkProxy;

export const config = {
  matcher: [
    // Enable a catch-all matcher for all requests
    // but skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

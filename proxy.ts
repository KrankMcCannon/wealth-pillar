import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './src/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const isPublicRoute = createRouteMatcher([
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/:locale/auth(.*)',
  '/auth(.*)',
  '/api/webhooks(.*)',
  '/:locale/terms',
  '/:locale/privacy',
  // Allow root path for redirection
  '/',
]);

const isServerActionRequest = (request: Request) =>
  request.method === 'POST' && Boolean(request.headers.get('next-action'));

const isApiOrTrpcRequest = (pathname: string) =>
  pathname === '/api' ||
  pathname.startsWith('/api/') ||
  pathname === '/trpc' ||
  pathname.startsWith('/trpc/');

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;
  const isServerAction = isServerActionRequest(request);

  const shouldProtectInMiddleware = !isPublicRoute(request) && isApiOrTrpcRequest(pathname);

  if (shouldProtectInMiddleware) {
    await auth.protect();
  }

  // Skip locale redirects for Server Action requests only.
  // Other RSC/page requests still need next-intl middleware for locale routing.
  if (isServerAction) {
    return NextResponse.next();
  }

  return handleI18nRouting(request);
});

export const config = {
  matcher: [
    // Enable a catch-all matcher for all requests
    // but skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

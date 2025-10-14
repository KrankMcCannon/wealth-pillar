import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/sign-in/sso-callback',
  '/sign-up/sso-callback',
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/settings/admin(.*)',
]);

const isSuperAdminRoute = createRouteMatcher([
  '/superadmin(.*)',
  '/settings/superadmin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const { pathname } = req.nextUrl;

  // If user is not authenticated and trying to access protected routes
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // If user is authenticated but trying to access auth pages
  if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is authenticated and on root page, redirect to dashboard
  if (userId && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Role-based access control for admin routes
  if (isAdminRoute(req)) {
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;

    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard?error=insufficient-permissions', req.url));
    }
  }

  // Super admin only routes
  if (isSuperAdminRoute(req)) {
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;

    if (userRole !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard?error=insufficient-permissions', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
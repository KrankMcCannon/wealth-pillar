import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Clerk Middleware for Next.js 16
 *
 * This proxy handles authentication across the application.
 * It protects dashboard routes and allows public access to auth pages.
 */

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/auth(.*)',
  '/api/webhooks(.*)',
  '/terms',
  '/privacy',
]);

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  // Per Next.js 16 best practices, use Clerk's built-in protection
  // Auth checks moved to layouts for better performance
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

'use client';

import { QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query/client';

/**
 * Query Client Provider - Sets up TanStack Query for the application
 * Wraps the entire app with the QueryClientProvider and DevTools
 *
 * For SSR: Use HydrationBoundary in root layout before this provider
 * @example
 * import { HydrationBoundaryWrapper } from '@/lib/query/hydration';
 *
 * export default function RootLayout({ children }) {
 *   const state = await getServerDehydratedState();
 *   return (
 *     <HydrationBoundaryWrapper state={state}>
 *       <QueryClientProvider>
 *         {children}
 *       </QueryClientProvider>
 *     </HydrationBoundaryWrapper>
 *   );
 * }
 */
export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
          position="bottom"
        />
      )}
    </TanStackQueryClientProvider>
  );
}
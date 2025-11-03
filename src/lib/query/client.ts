'use client';

import { createQueryClient } from './factory';

/**
 * Client-side QueryClient instance
 * Used in the browser for all client-side queries
 * This singleton is safe for client-side usage only
 */
export const queryClient = createQueryClient();

export default queryClient;

/**
 * Services Layer - Business Logic
 *
 * This module exports all business logic services following SOLID principles:
 * - Single Responsibility: Each service handles one domain
 * - Open/Closed: Services are open for extension, closed for modification
 * - Liskov Substitution: Services can be substituted without breaking code
 * - Interface Segregation: Services expose only what clients need
 * - Dependency Inversion: Services depend on abstractions (Supabase client)
 *
 * Usage:
 * import { UserService, GroupService } from '@/lib/services';
 *
 * const { data: user, error } = await UserService.getLoggedUserInfo(clerkId);
 */

// Export all services
export { AccountService } from './account.service';
export { BudgetService } from './budget.service';
export { BudgetPeriodService } from './budget-period.service';
export { CategoryService } from './category.service';
export { GroupService } from './group.service';
export { RecurringService } from './recurring.service';
export { ReportPeriodService } from './report-period.service';
export { TransactionService } from './transaction.service';
export { UserService } from './user.service';
export { PageDataService } from './page-data.service';
export { FinanceLogicService } from './finance-logic.service';

// Export shared types
export type { BudgetProgress, UserBudgetSummary } from './budget.service';
export type { EnrichedBudgetPeriod } from './report-period.service';
export type { CategoryMetric, ReportMetrics } from './transaction.service';
export type { ServiceResult } from './user.service';

/**
 * Service Layer Documentation
 *
 * ## Architecture
 *
 * All services follow a consistent pattern:
 * 1. Static class methods for stateless operations
 * 2. ServiceResult<T> return type for consistent error handling
 * 3. Input validation on all public methods
 * 4. Automatic caching using Next.js unstable_cache
 * 5. Detailed JSDoc comments for IntelliSense support
 *
 * ## Error Handling
 *
 * Services return ServiceResult<T> with structure:
 * - data: T | null - The requested data or null if error
 * - error: string | null - Error message or null if success
 *
 * Example usage:
 * ```typescript
 * const { data, error } = await UserService.getUserById(userId);
 * if (error) {
 *   // Handle error
 *   console.error(error);
 *   return;
 * }
 * // Use data safely
 * console.log(data.name);
 * ```
 *
 * ## Caching Strategy
 *
 * All read operations are cached using Next.js unstable_cache:
 * - User data: 5 minutes TTL
 * - Group data: 10 minutes TTL
 * - Cache tags for granular invalidation
 *
 * To invalidate cache:
 * ```typescript
 * import { revalidateTag, CACHE_TAGS } from '@/lib/cache';
 *
 * // Invalidate specific user
 * revalidateTag(CACHE_TAGS.USER(userId));
 *
 * // Invalidate all users
 * revalidateTag(CACHE_TAGS.USERS);
 * ```
 *
 * ## Adding New Services
 *
 * To add a new service (e.g., AccountService):
 *
 * 1. Create file: `src/lib/services/account.service.ts`
 * 2. Follow the pattern in UserService/GroupService
 * 3. Add cache keys to `src/lib/cache/keys.ts`
 * 4. Add cache options to `src/lib/cache/config.ts`
 * 5. Export from this index file
 * 6. Update .claude.md documentation
 *
 * Example template:
 * ```typescript
 * import { supabaseServer } from '@/lib/database/server';
 * import { cached, accountCacheKeys, cacheOptions } from '@/lib/cache';
 * import type { ServiceResult } from './user.service';
 *
 * export class AccountService {
 *   static async getAccountById(id: string): Promise<ServiceResult<Account>> {
 *     // Implementation
 *   }
 * }
 * ```
 */

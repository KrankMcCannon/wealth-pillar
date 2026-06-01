import { describe, it, expect, vi, beforeEach } from 'vitest';
import { editClosingDateAction, getLatestClosedPeriodAction } from './budget-period-actions';
import type { BudgetPeriod, User } from '@/lib/types';

vi.mock('@/lib/cache/revalidation-paths', () => ({
  revalidateBudgetPeriodRelatedPaths: vi.fn(),
}));

vi.mock('@/lib/auth/cached-auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/server/use-cases/budget-periods/edit-closing-date.use-case', () => ({
  editBudgetPeriodClosingDateUseCase: vi.fn(),
  EditClosingDateError: class EditClosingDateError extends Error {
    constructor(public readonly code: string) {
      super(code);
    }
  },
  getLatestClosedBudgetPeriodUseCase: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  canAccessUserData: vi.fn(),
  isMember: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));

import { getCurrentUser } from '@/lib/auth/cached-auth';
import {
  editBudgetPeriodClosingDateUseCase,
  getLatestClosedBudgetPeriodUseCase,
} from '@/server/use-cases/budget-periods/edit-closing-date.use-case';
import { canAccessUserData, isMember } from '@/lib/utils';

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
    theme_color: null,
    budget_start_date: null,
    group_id: 'group-1',
    role: 'admin',
    clerk_id: 'clerk-1',
    default_account_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function createClosedPeriod(): BudgetPeriod {
  return {
    id: 'closed-1',
    user_id: 'user-1',
    start_date: '2024-05-01',
    end_date: '2024-05-31',
    is_active: false,
    created_at: '',
    updated_at: '',
  };
}

describe('editClosingDateAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
    vi.mocked(isMember).mockReturnValue(false);
    vi.mocked(canAccessUserData).mockReturnValue(true);
  });

  it('returns unauthenticated when user is missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null as unknown as User);

    const result = await editClosingDateAction('user-1', 'closed-1', '2024-05-28');
    expect(result.error).toBe('errors.unauthenticated');
  });

  it('blocks members from editing other users periods', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ role: 'member', id: 'user-1' }));
    vi.mocked(isMember).mockReturnValue(true);

    const result = await editClosingDateAction('user-2', 'closed-1', '2024-05-28');
    expect(result.error).toBe('errors.noPermissionEditClosingDate');
  });

  it('updates the latest closed period for authorized users', async () => {
    const closed = createClosedPeriod();
    vi.mocked(editBudgetPeriodClosingDateUseCase).mockResolvedValue({
      closedPeriod: closed,
      activePeriod: {
        id: 'active-1',
        user_id: 'user-1',
        start_date: '2024-06-01',
        end_date: null,
        is_active: true,
        created_at: '',
        updated_at: '',
      },
    });

    const result = await editClosingDateAction('user-1', 'closed-1', '2024-05-28');
    expect(result.data).toEqual(closed);
    expect(result.error).toBeNull();
  });
});

describe('getLatestClosedPeriodAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
    vi.mocked(isMember).mockReturnValue(false);
    vi.mocked(canAccessUserData).mockReturnValue(true);
  });

  it('returns the latest closed period', async () => {
    const closed = createClosedPeriod();
    vi.mocked(getLatestClosedBudgetPeriodUseCase).mockResolvedValue(closed);

    const result = await getLatestClosedPeriodAction('user-1');
    expect(result.data).toEqual(closed);
  });
});

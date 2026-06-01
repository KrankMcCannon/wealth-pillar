import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboardingWizard } from './use-onboarding-wizard';
import type { Category } from '@/lib/types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    label: 'Food',
    key: 'food',
    icon: 'utensils',
    color: '#ff0000',
    group_id: '',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

describe('useOnboardingWizard', () => {
  beforeEach(() => {
    let uuidCounter = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(
      () => `uuid-${++uuidCounter}` as `${string}-${string}-${string}-${string}-${string}`
    );
  });

  it('canProceed is false on step 0 until group name has more than one character', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useOnboardingWizard({ categories: mockCategories, onComplete })
    );

    expect(result.current.canProceed).toBe(false);

    act(() => {
      result.current.setGroupName('A');
    });
    expect(result.current.canProceed).toBe(false);

    act(() => {
      result.current.setGroupName('My Group');
    });
    expect(result.current.canProceed).toBe(true);
  });

  it('handleNext advances step when canProceed', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useOnboardingWizard({ categories: mockCategories, onComplete })
    );

    act(() => {
      result.current.setGroupName('My Group');
    });

    act(() => {
      result.current.handleNext();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('handleBack does not go below step 0', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useOnboardingWizard({ categories: mockCategories, onComplete })
    );

    act(() => {
      result.current.handleBack();
    });

    expect(result.current.currentStep).toBe(0);
  });

  it('removeAccount promotes first account as default when default is removed', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useOnboardingWizard({ categories: mockCategories, onComplete })
    );

    act(() => {
      result.current.addAccount();
    });

    expect(result.current.accounts).toHaveLength(2);

    act(() => {
      result.current.removeAccount(0);
    });

    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.accounts[0]?.isDefault).toBe(true);
  });

  it('buildOnboardingPayload trims fields and supports empty budgets', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useOnboardingWizard({ categories: mockCategories, onComplete })
    );

    act(() => {
      result.current.setGroupName('  Group  ');
      result.current.setGroupDescription('  Desc  ');
    });

    const full = result.current.buildOnboardingPayload();
    expect(full.group.name).toBe('Group');
    expect(full.group.description).toBe('Desc');

    const skipped = result.current.buildOnboardingPayload({ emptyBudgets: true });
    expect(skipped.budgets).toEqual([]);
  });

  it('handleSubmit sets localError when onComplete throws', async () => {
    const onComplete = vi.fn().mockRejectedValue(new Error('save failed'));
    const { result } = renderHook(() =>
      useOnboardingWizard({ categories: mockCategories, onComplete })
    );

    act(() => {
      result.current.setGroupName('My Group');
      result.current.handleNext();
    });

    act(() => {
      result.current.updateAccountField(0, 'name', 'Main');
    });

    act(() => {
      result.current.handleNext();
    });

    act(() => {
      result.current.updateBudgetField(0, 'description', 'Rent');
      result.current.updateBudgetField(0, 'amount', '100');
      result.current.updateBudgetField(0, 'categoryId', 'cat-1');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.localError).toBe('save failed');
    expect(onComplete).toHaveBeenCalled();
  });
});

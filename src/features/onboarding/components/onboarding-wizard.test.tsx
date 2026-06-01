import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
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

/**
 * Integration-style test for the same onComplete contract used by OnboardingWizard:
 * failed submit surfaces as a thrown error consumed by useOnboardingWizard.
 */
describe('OnboardingWizard onComplete integration', () => {
  beforeEach(() => {
    let uuidCounter = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(
      () => `uuid-${++uuidCounter}` as `${string}-${string}-${string}-${string}-${string}`
    );
  });

  it('propagates submit failure to localError via onComplete throw', async () => {
    const onComplete = vi.fn().mockImplementation(async () => {
      throw new Error('Configuration failed');
    });

    const { result } = renderHook(() =>
      useOnboardingWizard({ categories: mockCategories, onComplete })
    );

    act(() => {
      result.current.setGroupName('My Group');
    });
    act(() => {
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

    await waitFor(() => {
      expect(result.current.localError).toBe('Configuration failed');
    });
    expect(onComplete).toHaveBeenCalled();
  });
});

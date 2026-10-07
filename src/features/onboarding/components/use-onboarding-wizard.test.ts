import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboardingWizard } from './use-onboarding-wizard';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('useOnboardingWizard', () => {
  beforeEach(() => {
    let uuidCounter = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(
      () => `uuid-${++uuidCounter}` as `${string}-${string}-${string}-${string}-${string}`
    );
  });

  it('has only group and account steps', () => {
    const { result } = renderHook(() => useOnboardingWizard({ onComplete: vi.fn() }));

    expect(result.current.steps.map((step) => step.id)).toEqual(['group', 'accounts']);
  });

  it('canProceed is false until a valid group name is entered', () => {
    const { result } = renderHook(() => useOnboardingWizard({ onComplete: vi.fn() }));

    expect(result.current.canProceed).toBe(false);

    act(() => {
      result.current.setGroupName('My Group');
    });

    expect(result.current.canProceed).toBe(true);
  });

  it('moves from group to accounts', () => {
    const { result } = renderHook(() => useOnboardingWizard({ onComplete: vi.fn() }));

    act(() => {
      result.current.setGroupName('My Group');
    });

    act(() => {
      result.current.handleNext();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('builds a lightweight payload without budgets', () => {
    const { result } = renderHook(() => useOnboardingWizard({ onComplete: vi.fn() }));

    act(() => {
      result.current.setGroupName('  Group  ');
      result.current.setGroupDescription('  Desc  ');
      result.current.updateAccountField(0, 'name', 'Main account');
    });

    const payload = result.current.buildOnboardingPayload();

    expect(payload.group).toEqual({
      name: 'Group',
      description: 'Desc',
    });
    expect(payload.accounts[0]?.name).toBe('Main account');
    expect(payload.budgets).toEqual([]);
    expect(payload.budgetStartDay).toBe(1);
  });

  it('submits after the account step', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useOnboardingWizard({ onComplete }));

    act(() => {
      result.current.setGroupName('My Group');
    });

    act(() => {
      result.current.handleNext();
    });

    act(() => {
      result.current.updateAccountField(0, 'name', 'Main');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        budgets: [],
        budgetStartDay: 1,
      })
    );
  });

  it('surfaces submission failures', async () => {
    const onComplete = vi.fn().mockRejectedValue(new Error('save failed'));

    const { result } = renderHook(() => useOnboardingWizard({ onComplete }));

    act(() => {
      result.current.setGroupName('My Group');
    });

    act(() => {
      result.current.handleNext();
    });

    act(() => {
      result.current.updateAccountField(0, 'name', 'Main');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.localError).toBe('save failed');
  });
});

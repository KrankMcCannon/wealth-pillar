import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnboardingWizard } from './use-onboarding-wizard';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('OnboardingWizard onComplete integration', () => {
  beforeEach(() => {
    let uuidCounter = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(
      () => `uuid-${++uuidCounter}` as `${string}-${string}-${string}-${string}-${string}`
    );
  });

  it('propagates submit failure after group and account setup', async () => {
    const onComplete = vi.fn().mockImplementation(async () => {
      throw new Error('Configuration failed');
    });

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

    await waitFor(() => {
      expect(result.current.localError).toBe('Configuration failed');
    });

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        budgets: [],
      })
    );
  });
});

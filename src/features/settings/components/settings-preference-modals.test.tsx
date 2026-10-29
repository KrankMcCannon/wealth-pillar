import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguagePreferenceModal } from './settings-preference-modals';
import { updateUserPreferencesAction } from '@/features/settings/actions';
const mocks = vi.hoisted(() => ({
  closeModal: vi.fn(),
  replace: vi.fn(),
  update: vi.fn(),
  toast: vi.fn(),
}));
vi.mock('next-intl', () => ({
  useLocale: () => 'it',
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => '/settings',
}));
vi.mock('@/hooks/use-toast', () => ({ toast: mocks.toast }));
vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({ modal: 'settings:language', closeModal: mocks.closeModal }),
}));
vi.mock('@/features/settings/actions', () => ({ updateUserPreferencesAction: vi.fn() }));
vi.mock('@/features/settings/context/settings-modals-context', () => ({
  useSettingsModalsContext: () => ({
    currentUser: { id: 'u1' },
    preferences: { language: 'it-IT' },
    onPreferenceUpdate: mocks.update,
  }),
}));
vi.mock('@/features/settings/utils/preference-options', () => ({
  usePreferenceOptions: () => ({ languageOptions: [] }),
}));
vi.mock('@/components/form/selection-modal', () => ({
  SelectionModal: ({
    onSave,
    isSaving,
  }: {
    onSave: (value: string) => Promise<void>;
    isSaving: boolean;
  }) => (
    <button disabled={isSaving} onClick={() => onSave('en-US')}>
      Save language
    </button>
  ),
}));

describe('language preference persistence', () => {
  beforeEach(() => vi.clearAllMocks());
  it('waits for persistence before success, closing or navigation', async () => {
    let complete!: (value: Awaited<ReturnType<typeof updateUserPreferencesAction>>) => void;
    vi.mocked(updateUserPreferencesAction).mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      })
    );
    render(<LanguagePreferenceModal />);
    fireEvent.click(screen.getByText('Save language'));
    expect(screen.getByRole('button')).toBeDisabled();
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.closeModal).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
    await act(async () => complete({ data: { language: 'en-US' } as never, error: null }));
    expect(mocks.update).toHaveBeenCalledWith('language', 'en-US');
    expect(mocks.replace).toHaveBeenCalledWith('/settings', { locale: 'en' });
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }));
  });
  it.each(['response', 'network', 'empty'])(
    'keeps the original language and allows retry after %s failure',
    async (failure) => {
      if (failure === 'network')
        vi.mocked(updateUserPreferencesAction).mockRejectedValueOnce(new Error('offline'));
      else
        vi.mocked(updateUserPreferencesAction).mockResolvedValueOnce({
          data: null,
          error: failure === 'response' ? 'Save failed' : null,
        });
      render(<LanguagePreferenceModal />);
      fireEvent.click(screen.getByText('Save language'));
      await waitFor(() =>
        expect(mocks.toast).toHaveBeenCalledWith(
          expect.objectContaining({ variant: 'destructive' })
        )
      );
      expect(mocks.update).not.toHaveBeenCalled();
      expect(mocks.closeModal).not.toHaveBeenCalled();
      expect(mocks.replace).not.toHaveBeenCalled();
      expect(screen.getByRole('button')).toBeEnabled();
    }
  );
});

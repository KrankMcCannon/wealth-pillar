import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { CurrencyPreferenceModal } from './settings-preference-modals';
import { CurrencyProvider } from '@/providers/currency-provider';
import { Amount } from '@/components/ui/primitives/amount';
import { updateUserPreferencesAction } from '../actions';
const mocks = vi.hoisted(() => ({ close: vi.fn(), update: vi.fn(), refresh: vi.fn() }));
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
  usePathname: () => '/settings',
}));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({ modal: 'settings:currency', closeModal: mocks.close }),
}));
vi.mock('../actions', () => ({ updateUserPreferencesAction: vi.fn() }));
vi.mock('../context/settings-modals-context', () => ({
  useSettingsModalsContext: () => ({
    currentUser: { id: 'owner' },
    preferences: { currency: 'EUR' },
    onPreferenceUpdate: mocks.update,
  }),
}));
vi.mock('../utils/preference-options', () => ({
  usePreferenceOptions: () => ({ currencyOptions: [{ value: 'EUR' }, { value: 'USD' }] }),
}));
vi.mock('@/components/form/selection-modal', () => ({
  SelectionModal: ({ onSave }: { onSave: (value: string) => void }) => (
    <button onClick={() => onSave('USD')}>Save USD</button>
  ),
}));
function Setup() {
  return (
    <CurrencyProvider
      snapshot={{
        currency: 'EUR',
        rates: { USD: { base: 'EUR', quote: 'USD', rate: 1.2, date: '2026-11-02' } },
      }}
      locale="en-US"
    >
      <Amount>{100}</Amount>
      <CurrencyPreferenceModal />
    </CurrencyProvider>
  );
}
beforeEach(() => vi.clearAllMocks());
it('changes the whole app currency only after persistence succeeds', async () => {
  let complete!: (value: Awaited<ReturnType<typeof updateUserPreferencesAction>>) => void;
  vi.mocked(updateUserPreferencesAction).mockReturnValue(
    new Promise((resolve) => {
      complete = resolve;
    })
  );
  render(<Setup />);
  fireEvent.click(screen.getByText('Save USD'));
  expect(screen.getByText('€100.00')).toBeInTheDocument();
  expect(mocks.close).not.toHaveBeenCalled();
  await act(async () => complete({ data: { currency: 'USD' } as never, error: null }));
  expect(screen.getByText('$120.00')).toBeInTheDocument();
  expect(mocks.update).toHaveBeenCalledWith('currency', 'USD');
  expect(mocks.refresh).toHaveBeenCalled();
});
it('keeps the prior display and modal open when saving fails', async () => {
  vi.mocked(updateUserPreferencesAction).mockResolvedValue({ data: null, error: 'failed' });
  render(<Setup />);
  await act(async () => fireEvent.click(screen.getByText('Save USD')));
  expect(screen.getByText('€100.00')).toBeInTheDocument();
  expect(mocks.close).not.toHaveBeenCalled();
  expect(mocks.refresh).not.toHaveBeenCalled();
});

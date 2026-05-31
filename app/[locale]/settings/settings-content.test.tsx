import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsContent from './settings-content';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'it',
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn(), resolvedTheme: 'dark' }),
}));

vi.mock('@/hooks', () => ({
  useMounted: () => true,
}));

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: null }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const openModal = vi.fn();

vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({
    modal: null,
    openModal,
    closeModal: vi.fn(),
  }),
}));

vi.mock('@/components/layout', () => ({
  AppPage: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="app-page">
      {title ? <h1>{title}</h1> : null}
      {children}
    </div>
  ),
  toAppPageHeaderUser: (user: { name?: string; role?: string }) => ({
    name: user.name,
    role: user.role,
  }),
}));

vi.mock('@/features/settings/context/settings-modals-context', () => ({
  SettingsModalsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/features/settings/components/settings-modal-renderer', () => ({
  default: () => null,
}));

vi.mock('@/features/settings/utils/preference-options', () => ({
  usePreferenceOptions: () => ({
    currencyOptions: [{ value: 'EUR', label: 'Euro', description: '' }],
    languageOptions: [{ value: 'it-IT', label: 'Italiano', description: '' }],
    timezoneOptions: [{ value: 'Europe/Rome', label: 'Rome', description: '' }],
  }),
}));

const currentUser = {
  id: 'u1',
  name: 'Alex Mercer',
  email: 'alex@example.com',
  role: 'admin',
  group_id: 'g1',
} as const;

const preferences = {
  id: 'pref-1',
  user_id: 'u1',
  currency: 'EUR',
  language: 'it-IT',
  timezone: 'Europe/Rome',
  notifications_push: true,
  notifications_email: false,
  notifications_budget_alerts: true,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('SettingsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all sections and wires profile edit', () => {
    render(
      <SettingsContent
        currentUser={currentUser as never}
        initialPreferences={preferences as never}
      />
    );

    expect(screen.getByTestId('app-page')).toBeInTheDocument();
    expect(screen.getByText('headerTitle')).toBeInTheDocument();
    expect(screen.getByText('Alex Mercer')).toBeInTheDocument();
    expect(screen.getByText('alex@example.com')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'editButton' }));
    expect(openModal).toHaveBeenCalledWith('settings:profile');
  });
});

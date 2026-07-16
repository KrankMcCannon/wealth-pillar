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
  useRequiredCurrentUser: () => currentUser,
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

vi.mock('@/hooks/use-page-header', () => ({
  usePageHeader: vi.fn(),
}));

vi.mock('@/components/layout', () => ({
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

vi.mock('@/hooks/use-required-user', () => ({
  useRequiredCurrentUser: () => currentUser,
}));

vi.mock('@/stores/reference-data-store', () => ({
  useCategories: () => [],
  useUsedCategoryKeys: () => [],
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
        initialGroupName="Famiglia Rossi"
      />
    );

    expect(screen.getByText('Alex Mercer')).toBeInTheDocument();
    expect(screen.getByText('alex@example.com')).toBeInTheDocument();
    expect(screen.getByText('manageTitle')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'editButton' }));
    expect(openModal).toHaveBeenCalledWith('settings:profile');

    fireEvent.click(screen.getByRole('button', { name: /manageGroupTitle/ }));
    expect(openModal).toHaveBeenCalledWith('settings:group');

    fireEvent.click(screen.getByRole('button', { name: /manageTitle/ }));
    expect(openModal).toHaveBeenCalledWith('settings:categories');
  });
});

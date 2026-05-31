import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsModalRenderer from './settings-modal-renderer';

const modalState = vi.hoisted(() => ({
  modal: null as string | null,
  closeModal: vi.fn(),
}));

vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => modalState,
}));

vi.mock('@/features/settings/context/settings-modals-context', () => ({
  useSettingsModalsContextOptional: () => ({
    currentUser: {
      id: 'u1',
      name: 'Alex',
      email: 'alex@example.com',
      group_id: 'g1',
      role: 'admin',
    },
    preferences: {
      currency: 'EUR',
      language: 'it-IT',
      timezone: 'Europe/Rome',
    },
    isAdmin: true,
    groupName: 'Famiglia Rossi',
    onPreferenceUpdate: vi.fn(),
    onProfileUpdate: vi.fn(),
    onGroupUpdate: vi.fn(),
  }),
}));

vi.mock('./manage-group-modal', () => ({
  ManageGroupModal: () => <div data-testid="manage-group-modal">group</div>,
}));

vi.mock('./manage-categories-modal', () => ({
  ManageCategoriesModal: () => <div data-testid="manage-categories-modal">categories</div>,
}));

vi.mock('./edit-profile-modal', () => ({
  EditProfileModal: () => <div data-testid="edit-profile-modal">profile</div>,
}));

vi.mock('./invite-member-modal', () => ({
  InviteMemberModal: () => <div data-testid="invite-member-modal">invite</div>,
}));

vi.mock('./settings-preference-modals', () => ({
  CurrencyPreferenceModal: () => <div data-testid="currency-modal">currency</div>,
  LanguagePreferenceModal: () => <div data-testid="language-modal">language</div>,
  TimezonePreferenceModal: () => <div data-testid="timezone-modal">timezone</div>,
}));

describe('SettingsModalRenderer', () => {
  beforeEach(() => {
    modalState.modal = null;
    vi.clearAllMocks();
  });

  it('renders only the active settings modal', async () => {
    modalState.modal = 'settings:currency';

    render(<SettingsModalRenderer />);

    expect(await screen.findByTestId('currency-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('edit-profile-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('language-modal')).not.toBeInTheDocument();
  });

  it('returns null when no settings modal is active', () => {
    modalState.modal = 'transaction';

    const { container } = render(<SettingsModalRenderer />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders manage group modal when active', async () => {
    modalState.modal = 'settings:group';

    render(<SettingsModalRenderer />);

    expect(await screen.findByTestId('manage-group-modal')).toBeInTheDocument();
  });

  it('renders manage categories modal when active', async () => {
    modalState.modal = 'settings:categories';

    render(<SettingsModalRenderer />);

    expect(await screen.findByTestId('manage-categories-modal')).toBeInTheDocument();
  });
});

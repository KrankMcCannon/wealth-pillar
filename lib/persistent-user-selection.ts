// Utility functions for persistent user selection across pages
const SELECTED_USER_KEY = 'wealth-pillar-selected-user';

/**
 * Save the selected user to localStorage
 */
export const saveSelectedUser = (userId: string): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SELECTED_USER_KEY, userId);
    }
  } catch (error) {
    console.warn('Failed to save selected user to localStorage:', error);
  }
};

/**
 * Get the selected user from localStorage
 */
export const getSelectedUser = (): string | null => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SELECTED_USER_KEY);
    }
  } catch (error) {
    console.warn('Failed to get selected user from localStorage:', error);
  }
  return null;
};

/**
 * Clear the selected user from localStorage
 */
export const clearSelectedUser = (): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SELECTED_USER_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear selected user from localStorage:', error);
  }
};

/**
 * Get the initial selected user based on stored value, URL params, and user permissions
 */
export const getInitialSelectedUser = (
  currentUser: { id: string; role: string },
  urlSelectedUser?: string | null
): string => {
  const savedUser = getSelectedUser();
  const candidateUser = savedUser || urlSelectedUser;
  
  if (candidateUser) {
    // Validate permission to view the candidate user
    if (currentUser.role === 'superadmin' || currentUser.role === 'admin' || candidateUser === currentUser.id) {
      // Save the valid selection
      saveSelectedUser(candidateUser);
      return candidateUser;
    } else {
      // If member tries to access other user's data, default to their own
      clearSelectedUser();
      saveSelectedUser(currentUser.id);
      return currentUser.id;
    }
  } else {
    // Default behavior: 'all' for admin/superadmin, user.id for members
    const defaultUser = (currentUser.role === 'superadmin' || currentUser.role === 'admin') ? 'all' : currentUser.id;
    saveSelectedUser(defaultUser);
    return defaultUser;
  }
};
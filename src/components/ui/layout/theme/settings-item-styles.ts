/**
 * SettingsItem Theme Styles
 *
 * Centralized styling for settings item components.
 * Provides consistent layout for settings lists with icon, label, value, and actions.
 */

export const settingsItemStyles = {
  // Base container
  container:
    'flex items-center justify-between py-3 first:pt-0 last:pb-0 w-full text-left transition-all duration-200 group hover:bg-card/60 active:bg-card/80',
  containerWithDivider:
    'flex items-center justify-between py-3 first:pt-0 last:pb-0 w-full text-left transition-all duration-200 group hover:bg-card/60 active:bg-card/80 border-b border-primary/20',
  clickable: 'cursor-pointer',

  // Left section (icon + content)
  left: 'flex items-center gap-3 flex-1 min-w-0',

  // Icon container
  iconContainer:
    'flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 shadow-sm transition-all duration-200 group-hover:scale-105 group-active:scale-95 [&_svg]:!text-current',
  iconColor: {
    default: 'bg-gradient-to-br from-primary/10 to-primary/5 text-primary',
    destructive: 'bg-gradient-to-br from-destructive/10 to-destructive/5 text-destructive',
  },
  icon: 'w-5 h-5',

  // Content (label + value)
  content: 'flex-1 min-w-0',
  label: 'text-sm font-semibold',
  value: 'text-xs mt-0.5',
  description: 'text-xs mt-0.5',
  textColor: {
    default: {
      label: 'text-primary',
      value: 'text-primary/70',
      description: 'text-primary/70',
    },
    destructive: {
      label: 'text-destructive',
      value: 'text-destructive/70',
      description: 'text-destructive/70',
    },
  },

  // Actions (right section)
  actions: {
    button:
      'text-primary hover:bg-primary/10 active:scale-95 transition-all duration-200 shrink-0 p-2 rounded-xl text-sm font-medium',
    buttonDestructive:
      'text-destructive hover:bg-destructive/10 active:scale-95 transition-all duration-200 shrink-0 p-2 rounded-xl text-sm font-medium',

    // Toggle switch
    toggle: {
      wrapper: 'relative inline-flex items-center cursor-pointer',
      input: 'sr-only peer',
      track:
        'relative w-11 h-6 bg-primary/20 peer-focus:ring-2 peer-focus:ring-primary rounded-full transition-colors peer-checked:bg-primary/80 peer-checked:[&>div]:translate-x-5',
      thumb:
        'absolute top-0.5 left-0.5 bg-card w-5 h-5 rounded-full transition-transform shadow-sm pointer-events-none',
    },

    // Chevron for navigation
    chevron: 'w-5 h-5 ml-2 transition-all duration-200 group-hover:translate-x-1',
    chevronColor: {
      default: 'text-primary/50 group-hover:text-primary',
      destructive: 'text-destructive/50 group-hover:text-destructive',
    },
  },

  // Disabled state
  disabled: 'opacity-50 cursor-not-allowed',
};

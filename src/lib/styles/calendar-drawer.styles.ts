/**
 * ============================================================================
 * CALENDAR DRAWER - CENTRALIZED STYLE CONFIGURATION
 * Modern redesign with primary color and white theme
 *
 * Design Theme:
 * - Primary color (#8B5CF6 purple) for accents and highlights
 * - White/light backgrounds for clean, modern look
 * - Improved borders and spacing
 * - Enhanced visual hierarchy
 * ============================================================================
 */

/**
 * Calendar Drawer Style Configuration
 *
 * Redesigned with primary/white color scheme for modern, clean appearance
 */
export const calendarDrawerStyles = {
  // ============================================================================
  // DRAWER CONTAINER
  // ============================================================================
  drawer: {
    /**
     * Overlay backdrop
     * - Darker overlay for better focus
     */
    overlay: [
      'fixed inset-0 z-50',
      'bg-black/70 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'duration-300',
    ].join(' '),

    /**
     * Drawer content container
     * - Clean white background
     * - Primary color border top
     * - Smooth rounded corners
     * - UPDATED: Reduced from 90vh to 75vh for better mobile UX
     */
    content: [
      'fixed bottom-0 left-0 right-0 z-50',
      'max-h-[75vh]',
      'rounded-t-3xl',
      'bg-card dark:bg-card',
      'border-t-4 border-primary',
      'shadow-2xl shadow-primary/10',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
      'duration-300',
    ].join(' '),

    /**
     * Drag handle indicator
     * - Primary color for visibility
     */
    handle: ['mx-auto mt-4 mb-3', 'h-1.5 w-16 shrink-0', 'rounded-full bg-primary/30'].join(' '),

    /**
     * Main content wrapper
     */
    wrapper: ['flex flex-col flex-1 min-h-0', 'overflow-hidden', 'px-6 pb-6'].join(' '),

    /**
     * Scrollable content area
     */
    scrollArea: 'overflow-y-auto overscroll-contain',
  },

  // ============================================================================
  // HEADER (Month/Year Navigation)
  // ============================================================================
  header: {
    /**
     * Header container
     * - White background with subtle border
     * - More padding for breathing room
     */
    container: [
      'flex items-center justify-between',
      'px-2 py-2 mb-2',
      'bg-card dark:bg-card',
      'border-b-2 border-primary/10',
    ].join(' '),

    /**
     * Month and year display
     * - Large, bold primary colored text
     */
    monthYear: ['text-xl font-bold text-primary', 'flex-1 text-center', 'tracking-tight'].join(' '),
    center: 'flex-1 flex flex-col items-center gap-2',
    monthYearButton: [
      'hover:bg-primary/5 px-3 py-1 rounded-lg transition-colors',
      'flex items-center gap-1.5',
    ].join(' '),
    chevronIcon: 'h-4 w-4 text-primary/70',
    dropdowns: 'flex items-center gap-2 w-full max-w-[280px]',
    selectTrigger: 'h-9 text-sm font-semibold border-primary/20 focus:ring-primary',
    selectTriggerMonth: 'flex-1',
    selectTriggerYear: 'w-[90px]',
    selectContent: 'max-h-[240px]',
    selectItem: 'text-sm font-medium',
    selectItemYear: 'text-sm font-medium tabular-nums',
    closeButton: 'text-xs text-muted-foreground hover:text-primary transition-colors px-2',

    /**
     * Navigation buttons (previous/next)
     * - Primary color circular buttons
     * - Enhanced hover states
     * - Larger touch targets
     */
    navButton: {
      base: [
        'h-11 w-11 shrink-0',
        'inline-flex items-center justify-center',
        'rounded-full',
        'bg-primary/10 text-primary',
        'transition-all duration-200',
        'hover:bg-primary hover:text-white',
        'hover:scale-110 hover:shadow-lg hover:shadow-primary/30',
        'active:scale-95',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        'disabled:hover:bg-primary/10 disabled:hover:text-primary disabled:hover:scale-100',
        'disabled:hover:shadow-none',
      ].join(' '),
      icon: 'h-5 w-5 stroke-[2.5]',
    },
  },

  // ============================================================================
  // WEEKDAY LABELS
  // ============================================================================
  weekdays: {
    /**
     * Weekday labels container
     */
    container: ['grid grid-cols-7 gap-1', 'pb-2 px-2'].join(' '),

    /**
     * Individual weekday label
     * - Primary color for emphasis
     * - Bold and uppercase
     */
    label: [
      'text-xs font-bold text-primary uppercase',
      'text-center',
      'py-2',
      'tracking-wider',
    ].join(' '),
  },

  // ============================================================================
  // CALENDAR GRID
  // ============================================================================
  grid: {
    /**
     * Main calendar grid container
     */
    container: ['grid grid-cols-7 gap-2', 'place-items-center', 'pb-4 px-2'].join(' '),

    /**
     * Week row container
     */
    week: 'contents',

    /**
     * Empty cell for month padding
     */
    emptyCell: 'h-12 w-12',
  },

  // ============================================================================
  // DAY CELL (Individual dates)
  // ============================================================================
  day: {
    /**
     * Base day button styles
     * - Clean white background by default
     * - Primary color for interactions
     */
    base: [
      'inline-flex items-center justify-center',
      'h-12 w-12 min-h-12 min-w-12',
      'rounded-xl',
      'text-base font-semibold tabular-nums',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
    ].join(' '),

    /**
     * State-specific classes
     */
    states: {
      // Default state
      default: [
        'text-primary dark:text-primary',
        'bg-card dark:bg-card/90',
        'hover:bg-primary hover:text-white',
        'hover:scale-110 hover:shadow-md',
        'active:scale-95',
        'border border-primary/15',
      ].join(' '),

      // Selected date - Full primary color
      selected: [
        'bg-primary text-white',
        'ring-4 ring-primary/20',
        'shadow-lg shadow-primary/40',
        'hover:bg-primary/90 hover:scale-110',
        'font-bold scale-105',
        'border-0',
      ].join(' '),

      // Today's date - Primary outline
      today: [
        'bg-white dark:bg-gray-800',
        'text-primary',
        'ring-2 ring-primary',
        'font-bold',
        'hover:bg-primary hover:text-white hover:scale-110',
        'border-0',
      ].join(' '),

      // Disabled date
      disabled: [
        'text-gray-300 dark:text-gray-600',
        'bg-primary/5 dark:bg-primary/10',
        'cursor-not-allowed',
        'hover:bg-primary/5 hover:scale-100',
        'opacity-40',
        'border border-primary/15',
      ].join(' '),

      // Weekend date
      weekend: [
        'text-primary dark:text-primary',
        'bg-card dark:bg-card/90',
        'hover:bg-primary hover:text-white',
        'hover:scale-110',
        'border border-primary/15',
      ].join(' '),

      // Other month date
      otherMonth: [
        'text-gray-300 dark:text-gray-600',
        'bg-primary/5 dark:bg-primary/10',
        'hover:bg-primary/10 hover:text-primary/60',
        'hover:scale-105',
        'border border-primary/15',
      ].join(' '),
    },
  },

  // ============================================================================
  // QUICK PRESETS - REDESIGNED
  // ============================================================================
  presets: {
    /**
     * Presets section container
     * - White background with primary border
     * - Enhanced spacing and padding
     */
    section: ['border-t-2 border-primary/20', 'pt-4 pb-2', 'bg-white dark:bg-gray-900'].join(' '),

    /**
     * Section title
     * - Primary color
     * - More prominent
     */
    title: [
      'text-sm font-bold text-primary uppercase tracking-wider',
      'mb-3 px-2',
      'flex items-center gap-2',
    ].join(' '),
    icon: 'h-4 w-4',

    /**
     * Preset buttons container
     * - Grid layout for better organization
     */
    container: ['grid grid-cols-2 gap-2', 'px-1'].join(' '),

    /**
     * Individual preset button
     * - Clean bordered design
     * - Primary color on hover
     */
    button: {
      base: [
        'w-full',
        'h-11 px-4',
        'rounded-xl',
        'text-sm font-semibold',
        'transition-all duration-200',
        'bg-card dark:bg-card/90',
        'text-primary dark:text-primary',
        'border-2 border-primary/20',
        'hover:border-primary/20 hover:bg-primary hover:text-white',
        'hover:shadow-md hover:shadow-primary/20',
        'active:scale-95',
      ].join(' '),

      // Active preset
      active: [
        'bg-primary text-white',
        'border-primary',
        'shadow-md shadow-primary/30',
        'ring-2 ring-primary/20',
      ].join(' '),
    },
  },

  // ============================================================================
  // INPUT FIELD
  // ============================================================================
  input: {
    /**
     * Input group container
     */
    group: 'flex gap-2 w-full',

    /**
     * Input wrapper
     */
    wrapper: 'relative flex-1',

    /**
     * Text input field
     * - Clean white background
     * - Primary color focus
     */
    field: [
      'w-full h-11',
      'pr-10',
      'text-primary dark:text-primary',
      'rounded-xl',
      'border-2 border-primary/20',
      'bg-card dark:bg-card/90',
      'px-4 py-2',
      'text-sm font-medium',
      'transition-all',
      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
      'hover:border-primary/40',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ].join(' '),

    /**
     * Clear button
     */
    clearButton: [
      'absolute right-3 top-1/2 -translate-y-1/2',
      'text-gray-400 dark:text-gray-500',
      'hover:text-primary hover:scale-110',
      'transition-all duration-200',
      'active:scale-95',
    ].join(' '),

    clearIcon: 'h-4 w-4',

    /**
     * Calendar trigger button
     * - Primary color theme
     */
    triggerButton: {
      base: [
        'h-11 w-11 shrink-0',
        'rounded-xl',
        'border-2 border-primary/20',
        'bg-card dark:bg-card/90 text-primary',
        'hover:bg-primary hover:text-white hover:border-primary',
        'hover:scale-105 hover:shadow-md hover:shadow-primary/20',
        'transition-all duration-200',
        'active:scale-95',
      ].join(' '),

      // Active state
      active: ['bg-primary text-white border-primary', 'ring-2 ring-primary/30', 'scale-105'].join(
        ' '
      ),
    },

    triggerIcon: 'h-4 w-4',
  },

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================
  accessibility: {
    /**
     * Screen reader only content
     */
    srOnly: ['absolute w-px h-px p-0 -m-px', 'overflow-hidden whitespace-nowrap', 'border-0'].join(
      ' '
    ),

    /**
     * Live region for announcements
     */
    liveRegion: ['sr-only'].join(' '),
  },
} as const;

/**
 * Helper function to merge drawer styles
 */
export function getDrawerStyles(customStyles?: Partial<typeof calendarDrawerStyles>) {
  return {
    ...calendarDrawerStyles,
    ...customStyles,
  };
}

/**
 * Type export for TypeScript consumers
 */
export type CalendarDrawerStyles = typeof calendarDrawerStyles;

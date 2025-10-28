/**
 * Responsive Design Helpers
 * Mobile-first utility functions for responsive design
 *
 * Follows Next.js 15 mobile-first best practices
 * Usage: Import and use in components for responsive behavior
 */

/** Breakpoint constants */
export const breakpoints = {
  mobile: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/** Media query helpers */
export const mediaQueries = {
  mobile: '(max-width: 639px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  touch: '(hover: none) and (pointer: coarse)',
  notTouch: '(hover: hover) and (pointer: fine)',
} as const;

/**
 * Responsive class builder
 * Creates className string with responsive prefixes
 *
 * @example
 * responsiveClass({
 *   mobile: 'p-3 flex-col',
 *   md: 'p-6 flex-row',
 *   lg: 'p-8 gap-4'
 * })
 * // Returns: 'p-3 flex-col md:p-6 md:flex-row lg:p-8 lg:gap-4'
 */
export function responsiveClass(config: Partial<Record<keyof typeof breakpoints, string>>): string {
  const classes: string[] = [];

  // Mobile first (default/no prefix)
  if (config.mobile) {
    classes.push(config.mobile);
  }

  // Responsive prefixes
  const breakpointPrefixes = ['sm', 'md', 'lg', 'xl', '2xl'] as const;

  for (const bp of breakpointPrefixes) {
    if (config[bp]) {
      const classNames = config[bp]!.split(' ').map(cn => `${bp}:${cn}`).join(' ');
      classes.push(classNames);
    }
  }

  return classes.join(' ');
}

/**
 * Get responsive padding
 * Useful for page containers and sections
 */
export function getResponsivePadding() {
  return responsiveClass({
    mobile: 'p-3',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  });
}

/**
 * Get responsive section padding
 * For content sections within pages
 */
export function getResponsiveSectionPadding() {
  return responsiveClass({
    mobile: 'px-4 py-4',
    sm: 'px-6 py-6',
    md: 'px-8 py-8',
  });
}

/**
 * Get responsive gap for flex/grid
 */
export function getResponsiveGap() {
  return responsiveClass({
    mobile: 'gap-3',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  });
}

/**
 * Get responsive font size
 * For headings that scale with screen size
 */
export function getResponsiveFontSize(preset: 'title' | 'heading' | 'body') {
  const sizes = {
    title: responsiveClass({
      mobile: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl',
    }),
    heading: responsiveClass({
      mobile: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
    }),
    body: responsiveClass({
      mobile: 'text-sm',
      md: 'text-base',
    }),
  };
  return sizes[preset];
}

/**
 * Get responsive grid columns
 * For different layouts at different breakpoints
 */
export function getResponsiveGrid(preset: 'single' | 'twoCol' | 'threeCol') {
  const grids = {
    single: responsiveClass({
      mobile: 'grid-cols-1',
    }),
    twoCol: responsiveClass({
      mobile: 'grid-cols-2',
      md: 'grid-cols-3',
    }),
    threeCol: responsiveClass({
      mobile: 'grid-cols-2',
      md: 'grid-cols-3',
      lg: 'grid-cols-4',
    }),
  };
  return grids[preset];
}

/**
 * Get responsive metrics grid
 * Special case: 3 cols on desktop, 2 on mobile
 */
export function getResponsiveMetricsGrid() {
  return responsiveClass({
    mobile: 'grid-cols-2',
    sm: 'grid-cols-3',
  });
}

/**
 * Get responsive spacing scale
 * Returns consistent spacing scale based on breakpoint
 */
export function getResponsiveSpacing() {
  return {
    pageX: responsiveClass({
      mobile: 'px-3',
      sm: 'px-4',
      md: 'px-6',
    }),
    pageY: responsiveClass({
      mobile: 'py-3',
      sm: 'py-4',
      md: 'py-6',
    }),
    pageXY: responsiveClass({
      mobile: 'p-3',
      sm: 'p-4',
      md: 'p-6',
    }),
    sectionX: responsiveClass({
      mobile: 'px-4',
      sm: 'px-6',
      md: 'px-8',
    }),
    sectionY: responsiveClass({
      mobile: 'py-4',
      sm: 'py-6',
      md: 'py-8',
    }),
  };
}

/**
 * Get touch-friendly sizing
 * Ensures minimum 48px tap targets on mobile
 */
export function getTouchFriendlySize() {
  return responsiveClass({
    mobile: 'min-h-12 min-w-12',
    md: 'min-h-10 min-w-10',
  });
}

/**
 * Check if should show mobile layout
 * Used in components for conditional rendering
 */
export function isMobileLayout(width?: number): boolean {
  // If width provided, use it
  if (width !== undefined) {
    return width < breakpoints.sm;
  }
  // Otherwise check window (client-side only)
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.sm;
}

/**
 * Get device type
 */
export function getDeviceType(width?: number): 'mobile' | 'tablet' | 'desktop' {
  const w = width ?? (typeof window !== 'undefined' ? window.innerWidth : breakpoints.md);
  if (w < breakpoints.md) return 'mobile';
  if (w < breakpoints.lg) return 'tablet';
  return 'desktop';
}

/**
 * Responsive layout styles
 * Pre-configured responsive layouts for common patterns
 */
export const responsiveLayouts = {
  // Container with responsive padding
  container: responsiveClass({
    mobile: 'p-3',
    sm: 'p-4',
    md: 'p-6',
  }),

  // Section with responsive padding and gap
  section: responsiveClass({
    mobile: 'px-4 py-4 space-y-4',
    sm: 'px-6 py-6 space-y-6',
  }),

  // Card with responsive sizing
  card: responsiveClass({
    mobile: 'rounded-xl p-4',
    md: 'rounded-2xl p-6',
  }),

  // Grid with responsive columns
  gridAuto: responsiveClass({
    mobile: 'grid-cols-1',
    sm: 'grid-cols-2',
    md: 'grid-cols-3',
    lg: 'grid-cols-4',
  }),

  // Flex row that stacks on mobile
  rowMobileStack: responsiveClass({
    mobile: 'flex-col gap-3',
    sm: 'flex-row gap-4',
    md: 'gap-6',
  }),

  // Text that scales with screen
  scalingText: responsiveClass({
    mobile: 'text-base',
    sm: 'text-lg',
    md: 'text-xl',
  }),
};

/**
 * Hook-like function for responsive behavior
 * Returns config object with responsive values
 *
 * @example
 * const spacing = useResponsive('spacing');
 * className={spacing.container}
 */
export function useResponsive(preset: 'padding' | 'spacing' | 'gap' | 'fontSize') {
  const presets = {
    padding: getResponsivePadding(),
    spacing: getResponsiveSpacing(),
    gap: getResponsiveGap(),
    fontSize: getResponsiveFontSize('body'),
  };
  return presets[preset];
}

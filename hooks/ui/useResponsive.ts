import { useEffect, useState, useMemo, useCallback, useRef } from "react";

/**
 * Configurazione breakpoint personalizzabili
 * Principio OCP: Open/Closed - facilmente modificabile
 */
export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  large?: number;
}

/**
 * Dimensioni finestra con informazioni aggiuntive
 * Principio ISP: Interface Segregation - tutte le info necessarie
 */
export interface WindowSizeInfo {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: "portrait" | "landscape";
  isSmallScreen: boolean;
}

/**
 * Informazioni breakpoint complete
 * Principio ISP: Interface Segregation - informazioni specifiche
 */
export interface BreakpointInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  currentBreakpoint: "mobile" | "tablet" | "desktop" | "large";
  width: number;
  height: number;
}

/**
 * Configurazione predefinita per breakpoint
 * Principio DRY: Don't Repeat Yourself - configurazione riutilizzabile
 */
const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  large: 1920,
};

/**
 * Hook ottimizzato per gestire la dimensione della finestra
 * Principio SRP: Single Responsibility - solo dimensioni finestra
 * Principio DRY: Don't Repeat Yourself - logica SSR-safe
 * Performance: Debounced resize events
 */
export const useWindowSize = (debounceMs = 100): WindowSizeInfo => {
  // SSR-safe initial state
  const getInitialSize = (): Omit<WindowSizeInfo, "aspectRatio" | "orientation" | "isSmallScreen"> => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  const [windowSize, setWindowSize] = useState(getInitialSize);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };

    // Set initial size
    handleResize();

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [debounceMs]);

  // Calcoli memoizzati per performance
  const enhancedWindowSize = useMemo<WindowSizeInfo>(() => {
    const { width, height } = windowSize;
    const aspectRatio = width / height;
    const orientation = width > height ? "landscape" : "portrait";
    const isSmallScreen = width < DEFAULT_BREAKPOINTS.mobile;

    return {
      width,
      height,
      aspectRatio,
      orientation,
      isSmallScreen,
    };
  }, [windowSize]);

  return enhancedWindowSize;
};

/**
 * Hook ottimizzato per gestire il dark mode
 * Principio SRP: Single Responsibility - solo gestione tema
 * Performance: Observer unico con cleanup appropriato
 */
export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;

    return (
      document.documentElement.classList.contains("dark") || window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  const observerRef = useRef<MutationObserver | null>(null);
  const mediaQueryRef = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkDarkMode = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(isDark);
    };

    // Observer per cambiamenti della classe dark
    observerRef.current = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          checkDarkMode();
          break;
        }
      }
    });

    observerRef.current.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Media query listener per preferenze sistema
    mediaQueryRef.current = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => checkDarkMode();

    if (mediaQueryRef.current.addEventListener) {
      mediaQueryRef.current.addEventListener("change", handleMediaChange);
    } else {
      // Fallback per browser più vecchi
      mediaQueryRef.current.addListener(handleMediaChange);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (mediaQueryRef.current) {
        if (mediaQueryRef.current.removeEventListener) {
          mediaQueryRef.current.removeEventListener("change", handleMediaChange);
        } else {
          mediaQueryRef.current.removeListener(handleMediaChange);
        }
      }
    };
  }, []);

  /**
   * Toggle programmatico del dark mode
   * Principio SRP: Single Responsibility - solo toggle tema
   */
  const toggleDarkMode = useCallback(() => {
    if (typeof document === "undefined") return;

    document.documentElement.classList.toggle("dark");
  }, []);

  /**
   * Set esplicito del dark mode
   * Principio SRP: Single Responsibility - solo set tema
   */
  const setDarkMode = useCallback((enabled: boolean) => {
    if (typeof document === "undefined") return;

    if (enabled) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return {
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
  };
};

/**
 * Hook avanzato per gestire i breakpoint responsivi
 * Principio SRP: Single Responsibility - solo logica breakpoint
 * Principio OCP: Open/Closed - configurazione personalizzabile
 */
export const useBreakpoint = (customBreakpoints?: Partial<BreakpointConfig>): BreakpointInfo => {
  const { width, height } = useWindowSize();

  // Memoizza la configurazione dei breakpoint
  const breakpoints = useMemo(
    () => ({
      ...DEFAULT_BREAKPOINTS,
      ...customBreakpoints,
    }),
    [customBreakpoints]
  );

  // Calcola le informazioni sui breakpoint
  const breakpointInfo = useMemo<BreakpointInfo>(() => {
    const isMobile = width < breakpoints.mobile;
    const isTablet = width >= breakpoints.mobile && width < breakpoints.tablet;
    const isDesktop = width >= breakpoints.tablet && width < (breakpoints.large || Infinity);
    const isLarge = breakpoints.large ? width >= breakpoints.large : false;

    let currentBreakpoint: BreakpointInfo["currentBreakpoint"];
    if (isMobile) currentBreakpoint = "mobile";
    else if (isTablet) currentBreakpoint = "tablet";
    else if (isLarge) currentBreakpoint = "large";
    else currentBreakpoint = "desktop";

    return {
      isMobile,
      isTablet,
      isDesktop,
      isLarge,
      currentBreakpoint,
      width,
      height,
    };
  }, [width, height, breakpoints]);

  return breakpointInfo;
};

/**
 * Hook per media queries personalizzate
 * Principio SRP: Single Responsibility - solo media queries
 * Principio OCP: Open/Closed - supporta qualsiasi media query
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Add listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      // Fallback per browser più vecchi
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
};

/**
 * Hook per orientamento del dispositivo
 * Principio SRP: Single Responsibility - solo orientamento
 */
export const useOrientation = () => {
  const { width, height, orientation } = useWindowSize();

  const orientationInfo = useMemo(
    () => ({
      orientation,
      isPortrait: orientation === "portrait",
      isLandscape: orientation === "landscape",
      aspectRatio: width / height,
    }),
    [orientation, width, height]
  );

  return orientationInfo;
};

/**
 * Hook combinato per tutte le funzionalità responsive
 * Principio SRP: Single Responsibility - orchestrazione responsive
 * Principio DRY: Don't Repeat Yourself - tutte le funzionalità in uno
 */
export const useResponsive = (customBreakpoints?: Partial<BreakpointConfig>) => {
  const windowSize = useWindowSize();
  const breakpoint = useBreakpoint(customBreakpoints);
  const darkMode = useDarkMode();
  const orientation = useOrientation();

  // Utility functions
  const isMobileOrTablet = breakpoint.isMobile || breakpoint.isTablet;
  const isDesktopOrLarge = breakpoint.isDesktop || breakpoint.isLarge;

  return {
    // Window size info
    windowSize,

    // Breakpoint info
    breakpoint,

    // Dark mode
    darkMode,

    // Orientation
    orientation,

    // Convenience flags
    isMobileOrTablet,
    isDesktopOrLarge,

    // Convenience functions
    isBreakpoint: (bp: "mobile" | "tablet" | "desktop" | "large") => breakpoint.currentBreakpoint === bp,

    isAtLeast: (bp: "mobile" | "tablet" | "desktop" | "large") => {
      const order = ["mobile", "tablet", "desktop", "large"];
      const currentIndex = order.indexOf(breakpoint.currentBreakpoint);
      const targetIndex = order.indexOf(bp);
      return currentIndex >= targetIndex;
    },
  };
};

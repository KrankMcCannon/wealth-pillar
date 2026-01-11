"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { themeToggleStyles } from "./theme/theme-toggle-styles";

export function ThemeToggle() {
  const isDark = useSyncExternalStore(
    (callback) => {
      if (typeof document === "undefined") return () => {};
      const observer = new MutationObserver(() => callback());
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    },
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
    () => false
  );

  const toggleTheme = () => {
    const htmlElement = document.documentElement;
    const newIsDark = !isDark;
    
    if (newIsDark) {
      htmlElement.classList.remove("light");
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
      htmlElement.classList.add("light");
    }
    
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={themeToggleStyles.button}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className={themeToggleStyles.icon} />
      ) : (
        <Moon className={themeToggleStyles.icon} />
      )}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { themeToggleStyles } from "./theme/theme-toggle-styles";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return true;
    return document.documentElement.classList.contains("dark");
  });

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
    
    setIsDark(newIsDark);
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

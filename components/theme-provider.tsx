"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  resolvedTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const THEME_STORAGE_KEY = "dnl-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(
      THEME_STORAGE_KEY,
    ) as ThemeMode | null;
    const nextTheme = storedTheme === "dark" ? "dark" : "light";

    setThemeState(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme: theme,
      setTheme: (nextTheme) => {
        setThemeState(nextTheme);
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        applyTheme(nextTheme);
      },
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}

"use client";

import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export function ThemeToggleMenu() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenuRadioGroup
      value={resolvedTheme}
      onValueChange={(value) => setTheme(value as "light" | "dark")}
    >
      <DropdownMenuRadioItem value="light">Modo claro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark">Modo escuro</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  );
}

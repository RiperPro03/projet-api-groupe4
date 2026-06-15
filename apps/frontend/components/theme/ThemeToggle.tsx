"use client";

import {
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { setColorScheme } = useMantineColorScheme({ keepTransitions: true });
  const colorScheme = useComputedColorScheme("dark");

  return (
    <AnimatedThemeToggler
      theme={colorScheme}
      onThemeChange={setColorScheme}
      aria-label={
        colorScheme === "dark"
          ? "Activer le mode clair"
          : "Activer le mode sombre"
      }
      title={
        colorScheme === "dark"
          ? "Activer le mode clair"
          : "Activer le mode sombre"
      }
      className={cn(
        "flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-breezy-green hover:bg-accent [&_svg]:size-5",
        className,
      )}
    />
  );
}

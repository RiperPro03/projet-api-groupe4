"use client";

import {
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { setColorScheme } = useMantineColorScheme({ keepTransitions: true });
  const colorScheme = useComputedColorScheme("dark");
  const { t } = useI18n();
  const label =
    colorScheme === "dark" ? t("theme.enableLight") : t("theme.enableDark");

  return (
    <AnimatedThemeToggler
      theme={colorScheme}
      onThemeChange={setColorScheme}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-breezy-green hover:bg-accent [&_svg]:size-5",
        className,
      )}
    />
  );
}

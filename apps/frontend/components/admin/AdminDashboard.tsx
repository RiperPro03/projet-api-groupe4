"use client";

import Link from "next/link";
import { Group, Stack, Text } from "@mantine/core";
import { FiFlag, FiUsers } from "react-icons/fi";
import { useI18n } from "@/lib/i18n/client";

const adminMenuLinkClassName =
  "flex min-h-24 items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4 text-left outline-none transition-colors hover:border-breezy-green hover:bg-accent focus-visible:ring-2 focus-visible:ring-breezy-green";

export function AdminDashboard() {
  const { t } = useI18n();

  return (
    <section className="min-h-[calc(100svh-64px)] bg-transparent px-4 py-8 text-foreground md:min-h-svh">
      <div className="mx-auto w-full max-w-3xl">
        <Stack gap={4} mb="lg">
          <Text component="h1" fw={700} size="xl" style={{ color: "var(--foreground)" }}>
            {t("admin.title")}
          </Text>
          <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
            {t("admin.dashboardDescription")}
          </Text>
        </Stack>

        <Stack gap="md">
          <Link href="/admin/users" className={adminMenuLinkClassName}>
            <Group gap="md" wrap="nowrap">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-breezy-green/10 text-breezy-green">
                <FiUsers className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <Text component="span" fw={700} style={{ color: "var(--foreground)" }}>
                  {t("admin.overviewUsersTitle")}
                </Text>
                <Text component="span" display="block" size="sm" mt={4} style={{ color: "var(--muted-foreground)" }}>
                  {t("admin.overviewUsersDescription")}
                </Text>
              </span>
            </Group>
            <Text component="span" size="sm" fw={700} style={{ color: "var(--color-breezy-green)" }}>
              {t("admin.openSection")}
            </Text>
          </Link>

          <Link href="/admin/reports" className={adminMenuLinkClassName}>
            <Group gap="md" wrap="nowrap">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <FiFlag className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <Text component="span" fw={700} style={{ color: "var(--foreground)" }}>
                  {t("admin.overviewReportsTitle")}
                </Text>
                <Text component="span" display="block" size="sm" mt={4} style={{ color: "var(--muted-foreground)" }}>
                  {t("admin.overviewReportsDescription")}
                </Text>
              </span>
            </Group>
            <Text component="span" size="sm" fw={700} style={{ color: "var(--color-breezy-green)" }}>
              {t("admin.openSection")}
            </Text>
          </Link>
        </Stack>
      </div>
    </section>
  );
}

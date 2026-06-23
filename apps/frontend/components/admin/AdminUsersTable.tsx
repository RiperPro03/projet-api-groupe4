"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Badge,
  Card,
  Group,
  Loader,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { FiArrowLeft, FiFlag, FiSearch, FiUser, FiX } from "react-icons/fi";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { ShineBorder } from "@/components/ui/shine-border";
import {
  getProfiles,
  searchProfilesByUsername,
  type PublicProfile,
} from "@/lib/api/profile.service";
import {
  getUserStateById,
  updateUserRole,
  updateUserStatus,
  USER_STATE_ROLES,
  USER_STATE_STATUSES,
  type UserState,
  type UserStateRole,
  type UserStateStatus,
} from "@/lib/api/user-state.service";
import { getApiErrorMessage } from "@/lib/api/http-client";
import { useI18n } from "@/lib/i18n/client";

const fieldContainerClassName =
  "group relative overflow-hidden rounded-xl border border-transparent bg-background shadow-lg shadow-black/20 transition-shadow focus-within:shadow-[0_0_1.25rem_rgb(var(--breezy-green-rgb)_/_0.28)]";

type AdminUserRow = {
  profile: PublicProfile;
  state: UserState | null;
  stateLoadError: boolean;
};

// Shared admin table helpers
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);

    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

function isUserStateStatus(value: string | null): value is UserStateStatus {
  return USER_STATE_STATUSES.some((status) => status === value);
}

function isUserStateRole(value: string | null): value is UserStateRole {
  return USER_STATE_ROLES.some((role) => role === value);
}

// Loading placeholder
function AdminTableSkeleton() {
  return (
    <Stack gap="sm">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 rounded-lg border border-border bg-card p-4"
        >
          <div className="size-11 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-3 w-1/4 rounded bg-muted" />
          </div>
          <div className="h-9 w-36 rounded bg-muted" />
        </div>
      ))}
    </Stack>
  );
}

export function AdminUsersTable() {
  // Local view state
  const { t } = useI18n();
  const { notify } = useNotifications();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserIds, setUpdatingUserIds] = useState<Set<string>>(
    () => new Set()
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const debouncedQuery = useDebounce(query, 300);

  // Select options
  const statusOptions = useMemo(
    () => [
      { value: "ACTIVE", label: t("admin.statusActive") },
      { value: "INACTIVE", label: t("admin.statusInactive") },
    ],
    [t]
  );

  const roleOptions = useMemo(
    () => [
      { value: "ADMIN", label: t("admin.roleAdmin") },
      { value: "MODERATOR", label: t("admin.roleModerator") },
      { value: "USER", label: t("admin.roleUser") },
    ],
    [t]
  );

  // User list loading
  const loadUsers = useCallback(
    async (nextQuery: string) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setLoading(true);
      setError(null);

      try {
        const trimmedQuery = nextQuery.trim();
        const profiles = trimmedQuery
          ? await searchProfilesByUsername(trimmedQuery)
          : await getProfiles();

        const rows = await Promise.all(
          profiles.map(async (profile) => {
            try {
              const state = await getUserStateById(profile.id_user);

              return { profile, state, stateLoadError: false };
            } catch {
              return { profile, state: null, stateLoadError: true };
            }
          })
        );

        if (requestIdRef.current === requestId) {
          setUsers(rows);
        }
      } catch (loadError) {
        if (requestIdRef.current === requestId) {
          setUsers([]);
          setError(getApiErrorMessage(loadError, t("admin.loadError")));
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [t]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadUsers(debouncedQuery);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [debouncedQuery, loadUsers]);

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  // Status update action
  const handleStatusChange = async (
    userId: string,
    nextStatusValue: string | null
  ) => {
    if (!isUserStateStatus(nextStatusValue)) {
      return;
    }

    const previousRow = users.find((row) => row.profile.id_user === userId);

    if (!previousRow?.state || previousRow.state.statuts === nextStatusValue) {
      return;
    }

    setUpdatingUserIds((current) => new Set(current).add(userId));
    setUsers((currentUsers) =>
      currentUsers.map((row) =>
        row.profile.id_user === userId && row.state
          ? {
              ...row,
              state: {
                ...row.state,
                statuts: nextStatusValue,
              },
            }
          : row
      )
    );

    try {
      const updatedState = await updateUserStatus(userId, nextStatusValue);

      setUsers((currentUsers) =>
        currentUsers.map((row) =>
          row.profile.id_user === userId
            ? { ...row, state: updatedState, stateLoadError: false }
            : row
        )
      );
      notify(
        {
          title: t("admin.updateSuccessTitle"),
          description: t("admin.updateSuccessDescription", {
            username: previousRow.profile.username,
          }),
          tone: "success",
        },
        { duration: 2500 }
      );
    } catch (updateError) {
      setUsers((currentUsers) =>
        currentUsers.map((row) =>
          row.profile.id_user === userId ? previousRow : row
        )
      );
      notify(
        {
          title: t("admin.updateErrorTitle"),
          description: getApiErrorMessage(updateError, t("admin.updateError")),
          tone: "error",
        },
        { duration: 3500 }
      );
    } finally {
      setUpdatingUserIds((current) => {
        const next = new Set(current);
        next.delete(userId);
        return next;
      });
    }
  };

  // Role update action
  const handleRoleChange = async (
    userId: string,
    nextRoleValue: string | null
  ) => {
    if (!isUserStateRole(nextRoleValue)) {
      return;
    }

    const previousRow = users.find((row) => row.profile.id_user === userId);

    if (!previousRow?.state || previousRow.state.role === nextRoleValue) {
      return;
    }

    setUpdatingUserIds((current) => new Set(current).add(userId));
    setUsers((currentUsers) =>
      currentUsers.map((row) =>
        row.profile.id_user === userId && row.state
          ? {
              ...row,
              state: {
                ...row.state,
                role: nextRoleValue,
              },
            }
          : row
      )
    );

    try {
      const updatedState = await updateUserRole(userId, nextRoleValue);

      setUsers((currentUsers) =>
        currentUsers.map((row) =>
          row.profile.id_user === userId
            ? { ...row, state: updatedState, stateLoadError: false }
            : row
        )
      );
      notify(
        {
          title: t("admin.roleUpdateSuccessTitle"),
          description: t("admin.roleUpdateSuccessDescription", {
            username: previousRow.profile.username,
          }),
          tone: "success",
        },
        { duration: 2500 }
      );
    } catch (updateError) {
      setUsers((currentUsers) =>
        currentUsers.map((row) =>
          row.profile.id_user === userId ? previousRow : row
        )
      );
      notify(
        {
          title: t("admin.updateErrorTitle"),
          description: getApiErrorMessage(updateError, t("admin.roleUpdateError")),
          tone: "error",
        },
        { duration: 3500 }
      );
    } finally {
      setUpdatingUserIds((current) => {
        const next = new Set(current);
        next.delete(userId);
        return next;
      });
    }
  };

  // Admin table rendering
  return (
    <section className="min-h-[calc(100svh-64px)] bg-transparent px-4 py-8 text-foreground md:min-h-svh">
      <div className="mx-auto w-full max-w-6xl">
        <Group justify="space-between" align="flex-start" gap="md" mb="lg">
          <Stack gap={4}>
            <Text component="h1" fw={700} size="xl" style={{ color: "var(--foreground)" }}>
              {t("admin.overviewUsersTitle")}
            </Text>
            <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
              {t("admin.description")}
            </Text>
          </Stack>
          <Group gap="sm">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground outline-none transition-colors hover:border-breezy-green hover:text-breezy-green focus-visible:ring-2 focus-visible:ring-breezy-green"
            >
              <FiArrowLeft className="h-4 w-4" aria-hidden />
              {t("admin.backDashboard")}
            </Link>
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground outline-none transition-colors hover:border-breezy-green hover:text-breezy-green focus-visible:ring-2 focus-visible:ring-breezy-green"
            >
              <FiFlag className="h-4 w-4" aria-hidden />
              {t("admin.overviewReportsTitle")}
            </Link>
            <Badge
              variant="light"
              color="green"
              radius={8}
              size="lg"
              className="shrink-0"
            >
              {t("admin.userCount", { count: users.length })}
            </Badge>
          </Group>
        </Group>

        <div className={`${fieldContainerClassName} mb-6`}>
          <ShineBorder
            borderWidth="0.125rem"
            duration={15}
            shineColor={[
              "var(--color-breezy-green)",
              "var(--color-breezy-yellow)",
              "var(--color-breezy-green)",
            ]}
            className="z-20"
          />
          <div className="relative z-10 flex items-center rounded-[inherit] bg-background">
            <span className="pointer-events-none absolute left-4 text-muted-foreground">
              <FiSearch className="h-5 w-5" aria-hidden />
            </span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("admin.searchPlaceholder")}
              aria-label={t("admin.searchAria")}
              className="search-input w-full rounded-xl bg-transparent py-3 pl-11 pr-11 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label={t("search.clear")}
                className="absolute right-4 text-muted-foreground transition-colors hover:text-foreground"
              >
                <FiX className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        {loading && <AdminTableSkeleton />}

        {error && !loading && (
          <Card radius={8} p="md" withBorder style={{ borderColor: "var(--destructive)" }}>
            <Text size="sm" style={{ color: "var(--destructive)" }}>
              {error}
            </Text>
          </Card>
        )}

        {!loading && !error && users.length === 0 && (
          <Stack align="center" gap="xs" py={72}>
            <FiUser
              className="h-10 w-10 opacity-30"
              style={{ color: "var(--muted-foreground)" }}
              aria-hidden
            />
            <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
              {query
                ? t("search.noResults", { query })
                : t("admin.noUsers")}
            </Text>
          </Stack>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <ScrollArea>
              <Table
                verticalSpacing="md"
                horizontalSpacing="lg"
                highlightOnHover
                withRowBorders
                miw={760}
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t("admin.userColumn")}</Table.Th>
                    <Table.Th>{t("admin.roleColumn")}</Table.Th>
                    <Table.Th>{t("admin.statusColumn")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {users.map(({ profile, state, stateLoadError }) => {
                    const displayName = profile.nickname || profile.username;
                    const isUpdating = updatingUserIds.has(profile.id_user);
                    const profileHref = `/profile/${encodeURIComponent(profile.username)}`;

                    return (
                      <Table.Tr key={profile.id_user}>
                        <Table.Td>
                          <Group gap="sm" wrap="nowrap">
                            <Link
                              href={profileHref}
                              aria-label={t("profile.openProfileAria", {
                                username: profile.username,
                              })}
                              className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-breezy-green"
                            >
                              <Avatar
                                src={profile.url_photo || null}
                                alt={displayName}
                                radius="xl"
                                size={44}
                                color="green"
                              >
                                {displayName.slice(0, 2).toUpperCase()}
                              </Avatar>
                            </Link>
                            <Stack gap={2} style={{ minWidth: 0 }}>
                              <Link
                                href={profileHref}
                                className="text-sm font-bold text-foreground outline-none hover:text-breezy-green focus-visible:rounded focus-visible:ring-2 focus-visible:ring-breezy-green"
                              >
                                {displayName}
                              </Link>
                              <Text
                                component={Link}
                                href={profileHref}
                                size="sm"
                                truncate
                                style={{ color: "var(--muted-foreground)" }}
                                className="outline-none hover:text-breezy-green focus-visible:rounded focus-visible:ring-2 focus-visible:ring-breezy-green"
                              >
                                @{profile.username}
                              </Text>
                            </Stack>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Select
                            aria-label={t("admin.roleAria", {
                              username: profile.username,
                            })}
                            data={roleOptions}
                            value={state?.role ?? null}
                            placeholder={
                              stateLoadError
                                ? t("admin.roleUnavailable")
                                : t("admin.unknownState")
                            }
                            disabled={!state || isUpdating}
                            allowDeselect={false}
                            w={170}
                            comboboxProps={{ withinPortal: true }}
                            onChange={(value) =>
                              handleRoleChange(profile.id_user, value)
                            }
                          />
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <Select
                              aria-label={t("admin.statusAria", {
                                username: profile.username,
                              })}
                              data={statusOptions}
                              value={state?.statuts ?? null}
                              placeholder={
                                stateLoadError
                                  ? t("admin.statusUnavailable")
                                  : t("admin.unknownState")
                              }
                              disabled={!state || isUpdating}
                              allowDeselect={false}
                              w={160}
                              comboboxProps={{ withinPortal: true }}
                              onChange={(value) =>
                                handleStatusChange(profile.id_user, value)
                              }
                            />
                            {isUpdating && <Loader size="sm" color="green" />}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </div>
    </section>
  );
}

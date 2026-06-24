"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ActionIcon, Avatar, Card, Group, Loader, Menu, Stack, Text } from "@mantine/core";
import {
  FiArrowLeft,
  FiFlag,
  FiMessageCircle,
  FiMoreVertical,
  FiSlash,
  FiUserCheck,
  FiUserMinus,
  FiUserPlus,
} from "react-icons/fi";
import ProfileActivityTabs from "@/components/profil/ProfileActivityTabs";
import ProfileSocialStats from "@/components/profil/ProfileSocialStats";
import { RippleButton } from "@/components/ui/ripple-button";
import { ReportDialog } from "@/components/reports/ReportDialog";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import {
  getProfileByUsername,
  getFollowStatus,
  followUser,
  unfollowUser,
  type PublicProfile,
} from "@/lib/api/profile.service";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import { getApiErrorMessage } from "@/lib/api/http-client";
import { createContentReport } from "@/lib/api/report.service";
import { updateUserStatus } from "@/lib/api/user-state.service";
import { getAuthenticatedUserId } from "@/lib/current-user-ids";
import { useI18n } from "@/lib/i18n/client";

type PageState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      profile: PublicProfile;
      currentUserId: string | null;
      currentUserRole: "USER" | "MODERATOR" | "ADMIN" | null;
      isOwnProfile: boolean;
    };

const followButtonBaseClassName =
  "group mt-1 inline-flex h-10 min-w-36 items-center justify-center rounded-full border px-4 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-breezy-yellow disabled:cursor-wait disabled:opacity-70";

const followButtonClassName =
  "border-transparent bg-breezy-green text-black shadow-lg shadow-breezy-green/20 hover:bg-breezy-green/90";

const followingButtonClassName =
  "border-border bg-card/90 text-foreground hover:border-destructive/70 hover:bg-destructive/10 hover:text-destructive";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = decodeURIComponent(params.username as string);
  const { notify } = useNotifications();
  const { t } = useI18n();

  const [state, setState] = useState<PageState>({ status: "loading" });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReportingUser, setIsReportingUser] = useState(false);
  const [isBanningUser, setIsBanningUser] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [socialRefreshKey, setSocialRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [profile, currentUser] = await Promise.all([
          getProfileByUsername(username),
          getCurrentUserFromApi().catch(() => null),
        ]);

        if (cancelled) return;

        if (!profile) {
          setState({ status: "not_found" });
          return;
        }

        const currentUserId = currentUser ? getAuthenticatedUserId(currentUser) : null;

        const isOwn =
          currentUser?.profile?.username === profile.username ||
          currentUserId === profile.id_user;

        const following =
          !isOwn && currentUserId
            ? await getFollowStatus(currentUserId, profile.id_user)
            : false;

        if (cancelled) return;

        setState({
          status: "ready",
          profile,
          currentUserId,
          currentUserRole: currentUser?.user?.role ?? null,
          isOwnProfile: isOwn,
        });
        setIsFollowing(following);
      } catch {
        if (!cancelled)
          setState({ status: "error", message: t("profile.loadError") });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [username, t]);

  const handleFollowToggle = useCallback(async () => {
    if (state.status !== "ready" || !state.currentUserId) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(state.currentUserId, state.profile.id_user);
        setIsFollowing(false);
        setSocialRefreshKey((key) => key + 1);
        notify({
          title: t("profile.followRemovedTitle"),
          description: t("profile.followRemovedDescription", {
            username: state.profile.username,
          }),
          tone: "success",
        });
      } else {
        await followUser(state.currentUserId, state.profile.id_user);
        setIsFollowing(true);
        setSocialRefreshKey((key) => key + 1);
        notify({
          title: t("profile.followAddedTitle"),
          description: t("profile.followAddedDescription", {
            username: state.profile.username,
          }),
          tone: "success",
        });
      }
    } catch {
      notify({
        title: t("profile.followErrorTitle"),
        description: t("profile.followErrorDescription"),
        tone: "error",
      });
    } finally {
      setFollowLoading(false);
    }
  }, [state, isFollowing, notify, t]);

  const handleReportUser = useCallback(
    async (message: string) => {
      if (state.status !== "ready" || isReportingUser) {
        return;
      }

      setIsReportingUser(true);
      setReportError(null);

      try {
        await createContentReport({
          message,
          reportedUserId: state.profile.id_user,
        });
        setIsReportOpen(false);
        notify({
          title: t("report.successTitle"),
          description: t("report.userSuccessDescription", {
            username: state.profile.username,
          }),
          tone: "success",
        });
      } catch (error) {
        setReportError(
          getApiErrorMessage(
            error,
            t("report.errorDescription"),
            t("common.serverUnreachable")
          )
        );
      } finally {
        setIsReportingUser(false);
      }
    },
    [isReportingUser, notify, state, t]
  );

  const handleBanUser = useCallback(async () => {
    if (state.status !== "ready" || isBanningUser) {
      return;
    }

    const canBan =
      state.currentUserRole === "ADMIN" || state.currentUserRole === "MODERATOR";

    if (!canBan) {
      return;
    }

    if (!window.confirm(t("profile.banConfirm", { username: state.profile.username }))) {
      return;
    }

    setIsBanningUser(true);

    try {
      await updateUserStatus(state.profile.id_user, "INACTIVE");
      notify({
        title: t("profile.banSuccessTitle"),
        description: t("profile.banSuccessDescription", {
          username: state.profile.username,
        }),
        tone: "success",
      });
    } catch (error) {
      notify({
        title: t("profile.banErrorTitle"),
        description: getApiErrorMessage(
          error,
          t("profile.banErrorDescription"),
          t("common.serverUnreachable")
        ),
        tone: "error",
      });
    } finally {
      setIsBanningUser(false);
    }
  }, [isBanningUser, notify, state, t]);

  /* ── Loading ── */
  if (state.status === "loading") {
    return (
      <section className="min-h-[calc(100svh-64px)] bg-transparent px-5 py-8 md:min-h-svh">
        <div className="mx-auto w-full max-w-2xl">
          <Group justify="center" py="xl">
            <Loader color="green" />
          </Group>
        </div>
      </section>
    );
  }

  /* ── Not found ── */
  if (state.status === "not_found") {
    return (
      <section className="flex min-h-[calc(100svh-64px)] flex-col items-center justify-center gap-4 bg-transparent px-5 text-foreground md:min-h-svh">
        <Text size="xl" style={{ fontSize: "3rem" }}>
          🔍
        </Text>
        <Text fw={700} size="xl" style={{ color: "var(--foreground)" }}>
          {t("profile.userNotFoundTitle")}
        </Text>
        <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
          {t("profile.userNotFoundDescription", { username })}
        </Text>
        <Link href="/search">
          <RippleButton
            rippleColor="var(--color-breezy-black)"
            className="mt-2 rounded-full bg-breezy-green px-6 py-2 text-sm font-semibold text-black"
          >
            {t("profile.searchUser")}
          </RippleButton>
        </Link>
      </section>
    );
  }

  /* ── Erreur ── */
  if (state.status === "error") {
    return (
      <section className="flex min-h-[calc(100svh-64px)] flex-col items-center justify-center gap-3 bg-transparent px-5 text-foreground md:min-h-svh">
        <Card radius={8} p="md" withBorder style={{ borderColor: "var(--destructive)" }}>
          <Text size="sm" style={{ color: "var(--destructive)" }}>
            {state.message}
          </Text>
        </Card>
        <Link
          href="/"
          className="text-sm text-breezy-green underline hover:text-breezy-green/80"
        >
          {t("profile.backHome")}
        </Link>
      </section>
    );
  }

  /* ── Profil chargé ── */
  const { profile, isOwnProfile } = state;
  const displayName = profile.nickname || profile.username;
  const canModerateProfile =
    state.currentUserRole === "ADMIN" || state.currentUserRole === "MODERATOR";

  return (
    <section className="relative min-h-[calc(100svh-64px)] overflow-hidden bg-transparent px-5 py-8 text-foreground md:min-h-svh">
      <ReportDialog
        opened={isReportOpen}
        title={t("report.userTitle")}
        description={t("report.userDescription", { username: profile.username })}
        placeholder={t("report.userPlaceholder")}
        error={reportError}
        isSubmitting={isReportingUser}
        onClose={() => {
          if (!isReportingUser) {
            setIsReportOpen(false);
            setReportError(null);
          }
        }}
        onSubmit={handleReportUser}
      />

      <div className="mx-auto w-full max-w-2xl">
        {/* Retour */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden />
          {t("profile.back")}
        </button>

        {/* En-tête : avatar + bouton action */}
        <div className="flex items-start justify-between gap-4">
          <Avatar
            src={profile.url_photo || null}
            alt={t("profile.photoAlt", { name: displayName })}
            radius="xl"
            size={80}
            color="green"
            style={{ fontSize: "1.5rem", fontWeight: 700 }}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </Avatar>

          {/* Bouton Suivre / Suivi — masqué si c'est son propre profil */}
          {!isOwnProfile && (
            <Group gap="xs" align="flex-start" wrap="wrap">
              <Link href={`/chat/${encodeURIComponent(profile.id_user)}`}>
                <RippleButton
                  rippleColor="rgb(var(--breezy-green-rgb) / 0.25)"
                  className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-card/90 px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent"
                >
                  <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap leading-none">
                    <FiMessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{t("profile.message")}</span>
                  </span>
                </RippleButton>
              </Link>

              <RippleButton
                type="button"
                onClick={handleFollowToggle}
                disabled={followLoading}
                aria-pressed={isFollowing}
                aria-label={
                  isFollowing
                    ? t("profile.unfollowAria", { username: profile.username })
                    : t("profile.followAria", { username: profile.username })
                }
                rippleColor={
                  isFollowing
                    ? "var(--destructive)"
                    : "rgb(var(--breezy-green-rgb) / 0.25)"
                }
                className={`${followButtonBaseClassName} ${
                  isFollowing
                    ? followingButtonClassName
                    : followButtonClassName
                }`}
              >
                {followLoading ? (
                  <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                    <Loader
                      size="xs"
                      color={isFollowing ? "var(--destructive)" : "dark"}
                    />
                    <span>
                      {isFollowing
                        ? t("profile.unfollowLoading")
                        : t("profile.followLoading")}
                    </span>
                  </span>
                ) : isFollowing ? (
                  <>
                    <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap group-hover:hidden">
                      <FiUserCheck className="h-4 w-4" aria-hidden />
                      {t("profile.following")}
                    </span>
                    <span className="hidden items-center justify-center gap-2 whitespace-nowrap group-hover:inline-flex">
                      <FiUserMinus className="h-4 w-4" aria-hidden />
                      {t("profile.unfollow")}
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                    <FiUserPlus className="h-4 w-4" aria-hidden />
                    {t("profile.follow")}
                  </span>
                )}
              </RippleButton>

              <Menu position="bottom-end" shadow="md" width={210}>
                <Menu.Target>
                  <ActionIcon
                    aria-label={t("profile.moreActions")}
                    variant="subtle"
                    radius="xl"
                    size={40}
                    className="mt-1 border border-border bg-card/90 text-foreground hover:bg-accent"
                  >
                    <FiMoreVertical className="h-5 w-5" aria-hidden />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<FiFlag className="h-4 w-4" aria-hidden />}
                    disabled={isReportingUser}
                    onClick={() => {
                      setReportError(null);
                      setIsReportOpen(true);
                    }}
                  >
                    {t("report.userAction")}
                  </Menu.Item>

                  {canModerateProfile && (
                    <>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<FiSlash className="h-4 w-4" aria-hidden />}
                        disabled={isBanningUser}
                        onClick={() => void handleBanUser()}
                      >
                        {isBanningUser ? t("profile.banLoading") : t("profile.banUser")}
                      </Menu.Item>
                    </>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          )}

          {isOwnProfile && (
            <Link href="/profile">
              <RippleButton
                rippleColor="rgb(var(--breezy-green-rgb) / 0.15)"
                className="mt-1 inline-flex items-center rounded-full border border-border bg-transparent px-5 py-2 text-sm font-semibold text-foreground hover:bg-accent"
              >
                {t("profile.editProfile")}
              </RippleButton>
            </Link>
          )}
        </div>

        {/* Infos */}
        <Stack gap={2} mt="md">
          <Text fw={700} size="xl" style={{ color: "var(--foreground)" }}>
            {displayName}
          </Text>
          <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
            @{profile.username}
          </Text>
        </Stack>

        <ProfileSocialStats
          profileUserId={profile.id_user}
          username={profile.username}
          refreshKey={socialRefreshKey}
        />

        {profile.bio && (
          <Text mt="md" lh={1.6} style={{ color: "var(--foreground)", opacity: 0.85 }}>
            {profile.bio}
          </Text>
        )}

        {/* Onglets posts / commentaires */}
        <div className="mt-8">
          <ProfileActivityTabs profileUserId={profile.id_user} isOwnProfile={isOwnProfile} />
        </div>
      </div>
    </section>
  );
}

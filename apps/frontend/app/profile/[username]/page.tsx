"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Avatar, Card, Group, Loader, Stack, Text } from "@mantine/core";
import {
  FiArrowLeft,
  FiCalendar,
  FiUserCheck,
  FiUserMinus,
  FiUserPlus,
} from "react-icons/fi";
import ProfileActivityTabs from "@/components/profil/ProfileActivityTabs";
import ProfileSocialStats from "@/components/profil/ProfileSocialStats";
import { Particles } from "@/components/ui/particles";
import { RippleButton } from "@/components/ui/ripple-button";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import {
  getProfileByUsername,
  getFollowStatus,
  followUser,
  unfollowUser,
  type PublicProfile,
} from "@/lib/api/profile.service";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import { useI18n } from "@/lib/i18n/client";

type PageState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      profile: PublicProfile;
      currentUserId: string | null;
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
  const username = decodeURIComponent(params.username as string);
  const { notify } = useNotifications();
  const { dateLocale, t } = useI18n();

  const [state, setState] = useState<PageState>({ status: "loading" });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
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

        const currentUserId =
          currentUser?.profile?.id_user ??
          currentUser?.user?.id_user ??
          currentUser?.auth.id ??
          null;

        const isOwn =
          currentUser?.profile?.username === profile.username ||
          currentUserId === profile.id_user;

        const following =
          !isOwn && currentUserId
            ? await getFollowStatus(currentUserId, profile.id_user)
            : false;

        if (cancelled) return;

        setState({ status: "ready", profile, currentUserId, isOwnProfile: isOwn });
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

  /* ── Loading ── */
  if (state.status === "loading") {
    return (
      <section className="min-h-[calc(100svh-64px)] bg-background px-5 py-8 md:min-h-svh">
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
      <section className="flex min-h-[calc(100svh-64px)] flex-col items-center justify-center gap-4 bg-background px-5 text-foreground md:min-h-svh">
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
      <section className="flex min-h-[calc(100svh-64px)] flex-col items-center justify-center gap-3 bg-background px-5 text-foreground md:min-h-svh">
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
  const joinedAt = new Intl.DateTimeFormat(dateLocale, {
    month: "long",
    year: "numeric",
  }).format(new Date(profile.createdAt));

  return (
    <section className="relative min-h-[calc(100svh-64px)] overflow-hidden bg-background px-5 py-8 text-foreground md:min-h-svh">
      <Particles
        className="z-0"
        quantity={100}
        color="var(--foreground)"
        size={1.1}
        speed={0.3}
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        {/* Retour */}
        <Link
          href="/search"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden />
          {t("profile.backSearch")}
        </Link>

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

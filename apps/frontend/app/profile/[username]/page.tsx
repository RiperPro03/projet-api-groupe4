"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Avatar, Card, Group, Loader, Stack, Text } from "@mantine/core";
import { FiArrowLeft, FiCalendar, FiUserCheck, FiUserPlus } from "react-icons/fi";
import ProfileActivityTabs from "@/components/profil/ProfileActivityTabs";
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

export default function PublicProfilePage() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string);
  const { notify } = useNotifications();

  const [state, setState] = useState<PageState>({ status: "loading" });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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

        setState({ status: "ready", profile, currentUserId, isOwnProfile: isOwn });

        if (!isOwn && currentUserId) {
          const following = await getFollowStatus(currentUserId, profile.id_user);
          if (!cancelled) setIsFollowing(following);
        }
      } catch {
        if (!cancelled)
          setState({ status: "error", message: "Impossible de charger ce profil." });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [username]);

  const handleFollowToggle = useCallback(async () => {
    if (state.status !== "ready" || !state.currentUserId) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(state.currentUserId, state.profile.id_user);
        setIsFollowing(false);
        notify({
          title: "Abonnement retiré",
          description: `Vous ne suivez plus @${state.profile.username}.`,
          tone: "success",
        });
      } else {
        await followUser(state.currentUserId, state.profile.id_user);
        setIsFollowing(true);
        notify({
          title: "Abonnement ajouté",
          description: `Vous suivez maintenant @${state.profile.username}.`,
          tone: "success",
        });
      }
    } catch {
      notify({
        title: "Erreur",
        description: "Impossible de modifier l'abonnement. Réessayez.",
        tone: "error",
      });
    } finally {
      setFollowLoading(false);
    }
  }, [state, isFollowing, notify]);

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
          Utilisateur introuvable
        </Text>
        <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
          Le profil{" "}
          <Text component="span" fw={600} style={{ color: "var(--foreground)" }}>
            @{username}
          </Text>{" "}
          n'existe pas.
        </Text>
        <Link href="/search">
          <RippleButton
            rippleColor="rgba(0,0,0,0.2)"
            className="mt-2 rounded-full bg-breezy-green px-6 py-2 text-sm font-semibold text-black"
          >
            Rechercher un utilisateur
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
          <Text size="sm" c="red">
            {state.message}
          </Text>
        </Card>
        <Link
          href="/"
          className="text-sm text-breezy-green underline hover:text-breezy-green/80"
        >
          Retour à l'accueil
        </Link>
      </section>
    );
  }

  /* ── Profil chargé ── */
  const { profile, isOwnProfile } = state;
  const displayName = profile.nickname || profile.username;
  const joinedAt = new Intl.DateTimeFormat("fr-FR", {
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
          Retour à la recherche
        </Link>

        {/* En-tête : avatar + bouton action */}
        <div className="flex items-start justify-between gap-4">
          <Avatar
            src={profile.url_photo || null}
            alt={`Photo de profil de ${displayName}`}
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
              onClick={handleFollowToggle}
              disabled={followLoading}
              aria-label={
                isFollowing
                  ? `Ne plus suivre @${profile.username}`
                  : `Suivre @${profile.username}`
              }
              rippleColor={isFollowing ? "rgba(220,38,38,0.2)" : "rgba(0,0,0,0.2)"}
              className={`mt-1 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all disabled:opacity-60 ${
                isFollowing
                  ? "border border-border bg-transparent text-foreground hover:border-red-500 hover:text-red-500"
                  : "bg-breezy-green text-black hover:bg-breezy-green/80"
              }`}
            >
              {followLoading ? (
                <Loader size="xs" color={isFollowing ? "red" : "dark"} />
              ) : isFollowing ? (
                <FiUserCheck className="h-4 w-4" aria-hidden />
              ) : (
                <FiUserPlus className="h-4 w-4" aria-hidden />
              )}
              {isFollowing ? "Suivi" : "Suivre"}
            </RippleButton>
          )}

          {isOwnProfile && (
            <Link href="/profile">
              <RippleButton
                rippleColor="rgba(0,146,62,0.15)"
                className="mt-1 inline-flex items-center rounded-full border border-border bg-transparent px-5 py-2 text-sm font-semibold text-foreground hover:bg-accent"
              >
                Modifier le profil
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

        {profile.bio && (
          <Text mt="md" lh={1.6} style={{ color: "var(--foreground)", opacity: 0.85 }}>
            {profile.bio}
          </Text>
        )}

        <Group gap={6} mt="md">
          <FiCalendar
            className="h-4 w-4"
            style={{ color: "var(--muted-foreground)" }}
            aria-hidden
          />
          <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
            A rejoint Breezyl en {joinedAt}
          </Text>
        </Group>

        {/* Onglets posts / commentaires */}
        <div className="mt-8">
          <ProfileActivityTabs profileUserId={profile.id_user} isOwnProfile={isOwnProfile} />
        </div>
      </div>
    </section>
  );
}

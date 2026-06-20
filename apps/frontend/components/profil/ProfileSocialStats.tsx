"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, Loader } from "@mantine/core";
import { FiX } from "react-icons/fi";
import {
  getFollowersProfiles,
  getFollowingProfiles,
  getFollowStats,
  type FollowStats,
  type PublicProfile,
} from "@/lib/api/profile.service";
import { useI18n } from "@/lib/i18n/client";

type SocialListType = "following" | "followers";

type SocialDialogState = {
  type: SocialListType | null;
  profiles: PublicProfile[];
  loading: boolean;
  error: string | null;
};

type ProfileSocialStatsProps = {
  profileUserId: string;
  username: string;
  refreshKey?: number;
};

const emptyFollowStats: FollowStats = {
  followersCount: 0,
  followingCount: 0,
};

function getPluralLabel(count: number, singular: string, plural: string) {
  return Math.abs(count) > 1 ? plural : singular;
}

function SocialStat({
  count,
  singularLabel,
  pluralLabel,
  onClick,
  locale,
}: {
  count: number;
  singularLabel: string;
  pluralLabel: string;
  onClick: () => void;
  locale: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-baseline gap-1.5 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-breezy-yellow"
    >
      <span className="text-sm font-bold text-foreground transition-colors group-hover:text-breezy-green">
        {new Intl.NumberFormat(locale).format(count)}
      </span>
      <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
        {getPluralLabel(count, singularLabel, pluralLabel)}
      </span>
    </button>
  );
}

export default function ProfileSocialStats({
  profileUserId,
  username,
  refreshKey = 0,
}: ProfileSocialStatsProps) {
  const { dateLocale, t } = useI18n();
  const [followStats, setFollowStats] = useState<FollowStats>(emptyFollowStats);
  const [socialDialog, setSocialDialog] = useState<SocialDialogState>({
    type: null,
    profiles: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      const stats = await getFollowStats(profileUserId);

      if (!cancelled) {
        setFollowStats(stats);
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [profileUserId, refreshKey]);

  const openSocialDialog = useCallback(
    async (type: SocialListType) => {
      setSocialDialog({
        type,
        profiles: [],
        loading: true,
        error: null,
      });

      try {
        const profiles =
          type === "followers"
            ? await getFollowersProfiles(profileUserId)
            : await getFollowingProfiles(profileUserId);

        setSocialDialog({
          type,
          profiles,
          loading: false,
          error: null,
        });
      } catch {
        setSocialDialog({
          type,
          profiles: [],
          loading: false,
          error: t("social.loadError"),
        });
      }
    },
    [profileUserId, t]
  );

  const closeSocialDialog = () => {
    setSocialDialog({
      type: null,
      profiles: [],
      loading: false,
      error: null,
    });
  };

  const socialDialogTitle =
    socialDialog.type === "followers"
      ? t("social.followersTitle")
      : t("social.followingTitle");
  const socialDialogEmptyMessage =
    socialDialog.type === "followers"
      ? t("social.noFollowers")
      : t("social.noFollowing");

  return (
    <>
      <div
        className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2"
        aria-label={t("profile.statsAria")}
      >
        <SocialStat
          count={followStats.followingCount}
          singularLabel={t("social.followingSingular")}
          pluralLabel={t("social.followingPlural")}
          locale={dateLocale}
          onClick={() => {
            void openSocialDialog("following");
          }}
        />
        <SocialStat
          count={followStats.followersCount}
          singularLabel={t("social.followerSingular")}
          pluralLabel={t("social.followerPlural")}
          locale={dateLocale}
          onClick={() => {
            void openSocialDialog("followers");
          }}
        />
      </div>

      {socialDialog.type && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-4 pb-4 pt-16 backdrop-blur-sm md:items-center md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="social-dialog-title"
          onClick={closeSocialDialog}
        >
          <div
            className="flex max-h-[80dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 id="social-dialog-title" className="text-lg font-bold">
                  {socialDialogTitle}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">@{username}</p>
              </div>
              <button
                type="button"
                onClick={closeSocialDialog}
                aria-label={t("common.close")}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-breezy-yellow"
              >
                <FiX className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {socialDialog.loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <Loader size="sm" color="green" />
                  {t("common.loading")}
                </div>
              )}

              {!socialDialog.loading && socialDialog.error && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {socialDialog.error}
                </p>
              )}

              {!socialDialog.loading &&
                !socialDialog.error &&
                socialDialog.profiles.length === 0 && (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    {socialDialogEmptyMessage}
                  </p>
                )}

              {!socialDialog.loading &&
                !socialDialog.error &&
                socialDialog.profiles.length > 0 && (
                  <div className="space-y-1">
                    {socialDialog.profiles.map((socialProfile) => {
                      const socialDisplayName =
                        socialProfile.nickname || socialProfile.username;

                      return (
                        <Link
                          key={socialProfile.id_user}
                          href={`/profile/${encodeURIComponent(socialProfile.username)}`}
                          onClick={closeSocialDialog}
                          className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-breezy-yellow"
                        >
                          <Avatar
                            src={socialProfile.url_photo || null}
                            alt={socialDisplayName}
                            radius="xl"
                            size={44}
                            color="green"
                          >
                            {socialDisplayName.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {socialDisplayName}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                              @{socialProfile.username}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

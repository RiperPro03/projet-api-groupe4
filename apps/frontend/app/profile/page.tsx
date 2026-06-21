import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FiCalendar } from "react-icons/fi";
import ProfileActivityTabs from "@/components/profil/ProfileActivityTabs";
import ProfileSettingsMenu from "@/components/profil/ProfileSettingsMenu";
import ProfileSocialStats from "@/components/profil/ProfileSocialStats";
import { Particles } from "@/components/ui/particles";
import { getProfileUserId } from "@/lib/current-user-ids";
import { getCurrentUser } from "@/lib/current-user";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();

  return {
    title: t("profile.pageTitle"),
    description: t("profile.pageDescription"),
  };
}

export default async function ProfilePage() {
  const [currentUser, i18n] = await Promise.all([
    getCurrentUser(),
    getServerI18n(),
  ]);
  const { language, t } = i18n;

  if (!currentUser) {
    redirect("/login?redirect=/profile");
  }

  const { auth, profile } = currentUser;
  const username = profile?.username || auth.email.split("@")[0];
  const displayName = profile?.nickname || username;
  const profileUserId = getProfileUserId(currentUser);
  const joinedAtSource = profile?.createdAt || auth.createdAt;
  const joinedAt = new Intl.DateTimeFormat(language.dateLocale, {
    month: "long",
    year: "numeric",
  }).format(new Date(joinedAtSource));

  return (
    <section className="relative min-h-[calc(100svh-64px)] overflow-hidden bg-background px-5 py-8 text-foreground md:min-h-svh">
      <Particles
        className="z-0"
        quantity={120}
        color="var(--foreground)"
        size={1.2}
        speed={0.35}
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-breezy-green bg-cover bg-center text-2xl font-bold text-black"
            style={
              profile?.url_photo
                ? { backgroundImage: `url(${profile.url_photo})` }
                : undefined
            }
            aria-label={t("profile.photoAlt", { name: displayName })}
          />

          <ProfileSettingsMenu
            profile={{
              username,
              nickname: profile?.nickname ?? "",
              bio: profile?.bio ?? "",
              url_photo: profile?.url_photo ?? "",
            }}
          />
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground">@{username}</p>
        </div>

        <ProfileSocialStats profileUserId={profileUserId} username={username} />

        {profile?.bio && (
          <p className="mt-4 leading-6 text-foreground/85">{profile.bio}</p>
        )}
        
        <div className="mt-8">
          <ProfileActivityTabs profileUserId={profileUserId} />
        </div>
      </div>
    </section>
  );
}

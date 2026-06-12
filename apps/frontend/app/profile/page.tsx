import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FiCalendar } from "react-icons/fi";
import { Meteors } from "@/components/ui/meteors";
import ProfileSettingsMenu from "@/components/profile/ProfileSettingsMenu";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Mon profil",
  description: "Votre profil Breezyl.",
};

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?redirect=/profile");
  }

  const { auth, profile } = currentUser;
  const username = profile?.username || auth.email.split("@")[0];
  const displayName = profile?.nickname || username;
  const initial = displayName.charAt(0).toUpperCase();
  const joinedAtSource = profile?.createdAt || auth.createdAt;
  const joinedAt = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(joinedAtSource));

  return (
    <section className="relative min-h-[calc(100svh-64px)] overflow-hidden bg-breezy-black px-5 py-8 text-white md:min-h-svh">
      <Meteors
        number={25}
        minDuration={4}
        maxDuration={9}
        className="z-0"
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
            aria-label={`Photo de profil de ${displayName}`}
          >
            {initial}
          </div>

          <ProfileSettingsMenu />
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-white/50">@{username}</p>
        </div>

        {profile?.bio && (
          <p className="mt-4 leading-6 text-white/85">{profile.bio}</p>
        )}

        <p className="mt-4 flex items-center gap-1.5 text-sm text-white/50">
          <FiCalendar aria-hidden="true" />
          A rejoint Breezyl en {joinedAt}
        </p>
      </div>
    </section>
  );
}

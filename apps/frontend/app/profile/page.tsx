import type { Metadata } from "next";
import { FiCalendar, FiEdit3 } from "react-icons/fi";
import { connectedUser } from "@/lib/mock-user";
import { Meteors } from "@/components/ui/meteors";

export const metadata: Metadata = {
  title: `Profil de ${connectedUser.data.profile.nickname}`,
  description: `Profil Breezyl de ${connectedUser.data.profile.nickname}.`,
};

export default function ProfilePage() {
  const { profile } = connectedUser.data;
  const initial = profile.nickname.charAt(0).toUpperCase();
  const joinedAt = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(profile.createdAt));

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
            style={{ backgroundImage: `url(${profile.url_photo})` }}
            aria-label={`Photo de profil de ${profile.nickname}`}
          >
            {initial}
          </div>

          <div className="relative rounded-full">
            <button
              type="button"
              className="relative flex items-center gap-2 rounded-full bg-breezy-green hover:bg-breezy-green/90 px-4 py-2 text-sm font-semibold"
            >
              <FiEdit3 aria-hidden="true" />
              Modifier
            </button>
          </div>
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-bold">{profile.nickname}</h1>
          <p className="text-white/50">@{profile.username}</p>
        </div>

        <p className="mt-4 leading-6 text-white/85">{profile.bio}</p>

        <p className="mt-4 flex items-center gap-1.5 text-sm text-white/50">
          <FiCalendar aria-hidden="true" />
          A rejoint Breezyl en {joinedAt}
        </p>
      </div>
    </section>
  );
}

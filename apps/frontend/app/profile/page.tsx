import type { Metadata } from "next";
import { FiCalendar, FiEdit3, FiMail } from "react-icons/fi";
import { connectedUser } from "@/lib/mock-user";

export const metadata: Metadata = {
  title: `Profil de ${connectedUser.data.profile.nickname}`,
  description: `Profil Breezyl de ${connectedUser.data.profile.nickname}.`,
};

export default function ProfilePage() {
  const { auth, user, profile } = connectedUser.data;
  const initial = profile.nickname.charAt(0).toUpperCase();
  const joinedAt = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(profile.createdAt));

  return (
    <div className="min-h-svh bg-breezy-black text-white">
      <div className="mx-auto min-h-svh w-full max-w-2xl border-x border-white/10">
        <header className="border-b border-white/10 px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold">Profil</h1>
        </header>

        <div className="h-32 bg-[url('/profile-banner.png')] bg-cover bg-center sm:h-40" />

        <section className="px-4 pb-6 sm:px-6">
          <div className="-mt-12 flex items-end justify-between gap-4">
            <div
              className="flex size-24 items-center justify-center rounded-full border-4 border-breezy-black bg-breezy-green bg-cover bg-center text-2xl font-bold text-black"
              style={{ backgroundImage: `url(${profile.url_photo})` }}
              aria-label={`Photo de profil de ${profile.nickname}`}
            >
              {initial}
            </div>

            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold transition hover:border-breezy-green hover:text-breezy-green"
            >
              <FiEdit3 aria-hidden="true" />
              Modifier le profil
            </button>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">{profile.nickname}</h2>
              <span className="rounded-full bg-breezy-green/15 px-2 py-1 text-xs font-semibold text-breezy-green">
                {user.role}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">
                {user.statuts}
              </span>
            </div>
            <p className="text-white/50">@{profile.username}</p>
          </div>

          <p className="mt-4 leading-6 text-white/85">{profile.bio}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <FiMail aria-hidden="true" />
              {auth.email}
            </span>
            <span className="flex items-center gap-1.5">
              <FiCalendar aria-hidden="true" />
              A rejoint Breezyl en {joinedAt}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

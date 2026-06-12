"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FiEdit3, FiLogOut, FiSettings, FiX } from "react-icons/fi";
import { logoutAction } from "@/app/auth/actions";
import {
  updateCurrentProfileAction,
  type UpdateProfilePayload,
} from "@/app/profile/actions";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { clearAuthTokens } from "@/lib/auth-token-storage";

type ProfileSettingsMenuProps = {
  profile: UpdateProfilePayload;
};

const fieldClassName =
  "w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-breezy-green";

export default function ProfileSettingsMenu({
  profile,
}: ProfileSettingsMenuProps) {
  const router = useRouter();
  const { notify } = useNotifications();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(profile);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (
        isMenuOpen &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsEditorOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isEditorOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEditorOpen]);

  function openEditor() {
    setForm(profile);
    setIsMenuOpen(false);
    setIsEditorOpen(true);
  }

  function updateField(field: keyof UpdateProfilePayload, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateCurrentProfileAction(form);

      if (result.status === "error") {
        notify({
          tone: "error",
          title: "Modification impossible",
          description: result.message,
        });
        return;
      }

      notify({
        tone: "success",
        title: "Profil modifie",
        description: "Vos informations ont ete mises a jour.",
      });
      setIsEditorOpen(false);
      router.refresh();
    } catch {
      notify({
        tone: "error",
        title: "Modification impossible",
        description: "Une erreur inattendue est survenue.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logoutAction();
      clearAuthTokens();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
      setIsMenuOpen(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="Ouvrir les parametres du profil"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
        className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xl text-white transition-colors hover:border-breezy-green hover:bg-breezy-green hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-breezy-yellow"
      >
        <FiSettings aria-hidden="true" />
      </button>

      {isMenuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-14 z-30 w-56 overflow-hidden rounded-2xl border border-white/15 bg-[#111] p-2 shadow-2xl shadow-black/50"
        >
          <button
            type="button"
            role="menuitem"
            onClick={openEditor}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-breezy-yellow"
          >
            <FiEdit3 className="text-breezy-green" aria-hidden="true" />
            Modifier le profil
          </button>

          <div className="my-1 border-t border-white/10" />

          <button
            type="button"
            role="menuitem"
            disabled={isLoggingOut}
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 focus-visible:outline-2 focus-visible:outline-red-400 disabled:cursor-wait disabled:opacity-60"
          >
            <FiLogOut aria-hidden="true" />
            {isLoggingOut ? "Deconnexion..." : "Se deconnecter"}
          </button>
        </div>
      )}

      {isEditorOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onMouseDown={() => setIsEditorOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#111] p-6 text-white shadow-2xl shadow-black md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="edit-profile-title" className="text-xl font-bold">
                  Modifier le profil
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  Mettez a jour les informations visibles sur votre profil.
                </p>
              </div>

              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setIsEditorOpen(false)}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleProfileUpdate}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-white/75">
                  Nom d&apos;utilisateur
                </span>
                <input
                  autoFocus
                  required
                  value={form.username}
                  onChange={(event) => updateField("username", event.target.value)}
                  className={fieldClassName}
                  autoComplete="username"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-white/75">
                  Nom affiche
                </span>
                <input
                  value={form.nickname}
                  onChange={(event) => updateField("nickname", event.target.value)}
                  className={fieldClassName}
                  placeholder="Votre nom affiche"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-white/75">
                  Biographie
                </span>
                <textarea
                  value={form.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                  className={`${fieldClassName} min-h-28 resize-y`}
                  placeholder="Presentez-vous en quelques mots"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-white/75">
                  URL de la photo
                </span>
                <input
                  type="url"
                  value={form.url_photo}
                  onChange={(event) => updateField("url_photo", event.target.value)}
                  className={fieldClassName}
                  placeholder="https://exemple.com/photo.jpg"
                />
              </label>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-breezy-green px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-breezy-green/90 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

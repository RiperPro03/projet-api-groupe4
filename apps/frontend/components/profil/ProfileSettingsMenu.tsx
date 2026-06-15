"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiLogOut,
  FiSettings,
  FiShield,
  FiX,
} from "react-icons/fi";
import { logoutAction } from "@/app/auth/actions";
import {
  updateCurrentProfileAction,
  updatePasswordAction,
  type UpdateProfilePayload,
} from "@/app/profil/actions";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { clearAuthTokens } from "@/lib/auth-token-storage";

type ProfileSettingsMenuProps = {
  profile: UpdateProfilePayload;
};

const fieldClassName =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-breezy-green";

type PasswordFieldProps = {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  minLength?: number;
};

function PasswordField({
  id,
  label,
  autoComplete,
  value,
  onChange,
  autoFocus,
  minLength,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-medium text-foreground/75">
        {label}
      </span>
      <span className="relative block">
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          required
          minLength={minLength}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClassName} pr-12`}
        />
        <button
          type="button"
          aria-label={
            isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          onClick={() => setIsVisible((visible) => !visible)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-lg text-muted-foreground transition-colors hover:text-breezy-green"
        >
          {isVisible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}

export default function ProfileSettingsMenu({
  profile,
}: ProfileSettingsMenuProps) {
  const router = useRouter();
  const { notify } = useNotifications();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [form, setForm] = useState(profile);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    passwordConfirmation: "",
  });

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
        setIsSecurityOpen(false);
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
    if (!isEditorOpen && !isSecurityOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEditorOpen, isSecurityOpen]);

  function openEditor() {
    setForm(profile);
    setIsMenuOpen(false);
    setIsEditorOpen(true);
  }

  function openSecurity() {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      passwordConfirmation: "",
    });
    setIsMenuOpen(false);
    setIsSecurityOpen(true);
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

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isUpdatingPassword) {
      return;
    }

    if (passwordForm.newPassword !== passwordForm.passwordConfirmation) {
      notify({
        tone: "error",
        title: "Modification impossible",
        description: "La confirmation ne correspond pas au nouveau mot de passe.",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const result = await updatePasswordAction({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (result.status === "error") {
        notify({
          tone: "error",
          title: "Modification impossible",
          description: result.message,
        });
        return;
      }

      clearAuthTokens();
      router.replace("/login");
      router.refresh();
    } catch {
      notify({
        tone: "error",
        title: "Modification impossible",
        description: "Une erreur inattendue est survenue.",
      });
    } finally {
      setIsUpdatingPassword(false);
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
        className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-xl text-foreground transition-colors hover:border-breezy-green hover:bg-breezy-green hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-breezy-yellow"
      >
        <FiSettings aria-hidden="true" />
      </button>

      {isMenuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-14 z-30 w-56 overflow-hidden rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={openEditor}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-breezy-yellow"
          >
            <FiEdit3 className="text-breezy-green" aria-hidden="true" />
            Modifier le profil
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={openSecurity}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-breezy-yellow"
          >
            <FiShield className="text-breezy-yellow" aria-hidden="true" />
            Sécurité
          </button>

          <div className="my-1 border-t border-border" />

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
            className="max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="edit-profile-title" className="text-xl font-bold">
                  Modifier le profil
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mettez a jour les informations visibles sur votre profil.
                </p>
              </div>

              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setIsEditorOpen(false)}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleProfileUpdate}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground/75">
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
                <span className="mb-1.5 block text-sm font-medium text-foreground/75">
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
                <span className="mb-1.5 block text-sm font-medium text-foreground/75">
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
                <span className="mb-1.5 block text-sm font-medium text-foreground/75">
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
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
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

      {isSecurityOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onMouseDown={() => setIsSecurityOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="security-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="security-title" className="text-xl font-bold">
                  Securite
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Modifiez votre mot de passe. Vous devrez ensuite vous reconnecter.
                </p>
              </div>

              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setIsSecurityOpen(false)}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handlePasswordUpdate}>
              <PasswordField
                id="current-password"
                label="Mot de passe actuel"
                autoComplete="current-password"
                autoFocus
                value={passwordForm.currentPassword}
                onChange={(currentPassword) =>
                  setPasswordForm((current) => ({ ...current, currentPassword }))
                }
              />
              <PasswordField
                id="new-password"
                label="Nouveau mot de passe"
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(newPassword) =>
                  setPasswordForm((current) => ({ ...current, newPassword }))
                }
              />
              <PasswordField
                id="password-confirmation"
                label="Confirmer le nouveau mot de passe"
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.passwordConfirmation}
                onChange={(passwordConfirmation) =>
                  setPasswordForm((current) => ({
                    ...current,
                    passwordConfirmation,
                  }))
                }
              />

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSecurityOpen(false)}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="rounded-full bg-breezy-yellow px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-breezy-yellow/90 disabled:cursor-wait disabled:opacity-60"
                >
                  {isUpdatingPassword ? "Modification..." : "Modifier"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

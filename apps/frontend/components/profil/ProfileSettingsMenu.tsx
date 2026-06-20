"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Dropzone } from "@mantine/dropzone";
import {
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiImage,
  FiLogOut,
  FiSettings,
  FiShield,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { logoutAction } from "@/app/auth/actions";
import {
  updateCurrentProfileAction,
  updatePasswordAction,
  type UpdateProfilePayload,
} from "@/app/profile/actions";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { RippleButton } from "@/components/ui/ripple-button";
import { ShineBorder } from "@/components/ui/shine-border";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { getApiErrorMessage, httpClient } from "@/lib/api/http-client";
import { useI18n } from "@/lib/i18n/client";
import { isLocale } from "@/lib/i18n/config";

type ProfileSettingsMenuProps = {
  profile: UpdateProfilePayload;
};

const fieldClassName =
  "w-full rounded-[inherit] bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground";

const fieldContainerClassName =
  "group relative rounded-xl border border-input bg-background transition-shadow focus-within:border-transparent focus-within:shadow-[0_0_1.25rem_rgb(var(--breezy-green-rgb)_/_0.28)]";

const avatarMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const avatarMaxSize = 5 * 1024 * 1024;

type PresignedUrlResponse = {
  status: "success";
  data: {
    uploadUrl: string;
    objectKey: string;
    publicUrl: string;
    expiresIn: number;
  };
};

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
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-medium text-foreground/75">
        {label}
      </span>
      <span className={`${fieldContainerClassName} block`}>
        <ShineBorder
          borderWidth="0.125rem"
          duration={15}
          shineColor={[
            "var(--color-breezy-green)",
            "var(--color-breezy-yellow)",
            "var(--color-breezy-green)",
          ]}
          className="z-20 opacity-0 transition-opacity group-focus-within:opacity-100"
        />
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          required
          minLength={minLength}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClassName} relative z-10 pr-12`}
        />
        <button
          type="button"
          aria-label={
            isVisible ? t("auth.hidePassword") : t("auth.showPassword")
          }
          onClick={() => setIsVisible((visible) => !visible)}
          className="absolute inset-y-0 right-0 z-30 flex w-12 items-center justify-center text-lg text-muted-foreground transition-colors hover:text-breezy-green"
        >
          {isVisible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}

function getMediaObjectKeyFromUrl(url: string) {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const bucketSegment = "/breezy-media/";
    const bucketIndex = parsedUrl.pathname.indexOf(bucketSegment);

    if (bucketIndex < 0) {
      return null;
    }

    const objectKey = parsedUrl.pathname.slice(bucketIndex + bucketSegment.length);

    return objectKey ? decodeURIComponent(objectKey) : null;
  } catch {
    return null;
  }
}

async function uploadProfileImage(file: File, labels: { alt: string; uploadError: string }) {
  const presignedResponse = await httpClient.post<PresignedUrlResponse>(
    "/media/presigned-url",
    {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      alt: labels.alt,
      usage: "profile",
    },
  );

  await fetch(presignedResponse.data.data.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(labels.uploadError);
    }
  });

  return presignedResponse.data.data.publicUrl;
}

async function deletePreviousProfileImage(url: string) {
  const objectKey = getMediaObjectKeyFromUrl(url);

  if (!objectKey) {
    return;
  }

  await httpClient.delete(`/media/${encodeURIComponent(objectKey)}`).catch(() => undefined);
}

function getProfileUpdateErrorMessage(
  error: unknown,
  fallbackMessage: string,
  serverUnreachableMessage: string
) {
  const apiErrorMessage = getApiErrorMessage(
    error,
    fallbackMessage,
    serverUnreachableMessage
  );

  if (apiErrorMessage !== fallbackMessage) {
    return apiErrorMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}

export default function ProfileSettingsMenu({
  profile,
}: ProfileSettingsMenuProps) {
  const router = useRouter();
  const { notify } = useNotifications();
  const { locale, setLocale, languages, t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [form, setForm] = useState(profile);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function openEditor() {
    setForm(profile);
    setSelectedAvatar(null);
    setAvatarPreview(null);
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

  function updateSelectedAvatar(file: File) {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setSelectedAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleLanguageChange(value: string) {
    if (!isLocale(value) || value === locale) {
      return;
    }

    const nextLanguage = languages.find((language) => language.code === value);

    setLocale(value);
    notify({
      tone: "success",
      title: t("language.changedTitle"),
      description: t("language.changedDescription", {
        language: nextLanguage?.nativeName ?? value,
      }),
    });
    setIsMenuOpen(false);
    router.refresh();
  }

  async function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      let nextForm = form;
      const previousPhotoUrl = profile.url_photo;

      if (selectedAvatar) {
        const publicUrl = await uploadProfileImage(selectedAvatar, {
          alt: t("settings.profileImageAlt"),
          uploadError: t("settings.uploadError"),
        });
        nextForm = {
          ...form,
          url_photo: publicUrl,
        };
        setForm(nextForm);
      }

      const result = await updateCurrentProfileAction(nextForm);

      if (result.status === "error") {
        notify({
          tone: "error",
          title: t("settings.updateImpossible"),
          description: result.message,
        });
        return;
      }

      if (selectedAvatar && previousPhotoUrl && previousPhotoUrl !== nextForm.url_photo) {
        await deletePreviousProfileImage(previousPhotoUrl);
      }

      notify({
        tone: "success",
        title: t("settings.savedTitle"),
        description: t("settings.savedDescription"),
      });
      setIsEditorOpen(false);
      setSelectedAvatar(null);
      setAvatarPreview(null);
      router.refresh();
    } catch (error) {
      notify({
        tone: "error",
        title: t("settings.updateImpossible"),
        description: getProfileUpdateErrorMessage(
          error,
          t("common.unknownError"),
          t("common.serverUnreachable")
        ),
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
        title: t("settings.updateImpossible"),
        description: t("settings.passwordMismatch"),
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
          title: t("settings.updateImpossible"),
          description: result.message,
        });
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      notify({
        tone: "error",
        title: t("settings.updateImpossible"),
        description: t("common.unknownError"),
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={t("settings.open")}
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
          className="absolute right-0 top-14 z-30 w-72 overflow-hidden rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={openEditor}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-breezy-yellow"
          >
            <FiEdit3 className="text-breezy-green" aria-hidden="true" />
            {t("settings.editProfile")}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={openSecurity}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-breezy-yellow"
          >
            <FiShield className="text-breezy-yellow" aria-hidden="true" />
            {t("settings.security")}
          </button>

          <div className="my-1 border-t border-border" />

          <label className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium">
            <span className="flex min-w-0 items-center gap-3">
              <FiGlobe className="shrink-0 text-breezy-green" aria-hidden="true" />
              {t("language.label")}
            </span>
            <select
              value={locale}
              aria-label={t("language.selectLabel")}
              onChange={(event) => handleLanguageChange(event.target.value)}
              className="h-9 w-40 rounded-full border border-border bg-background pl-3 pr-8 text-sm font-semibold text-foreground outline-none transition-colors hover:border-breezy-green focus-visible:outline-2 focus-visible:outline-breezy-yellow"
            >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.shortName} · {language.nativeName}
                </option>
              ))}
            </select>
          </label>

          <div className="my-1 border-t border-border" />

          <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium">
            <span>{t("settings.theme")}</span>
            <ThemeToggle className="h-10 w-24 rounded-full" />
          </div>

          <div className="my-1 border-t border-border" />

          <button
            type="button"
            role="menuitem"
            disabled={isLoggingOut}
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-destructive disabled:cursor-wait disabled:opacity-60"
          >
            <FiLogOut aria-hidden="true" />
            {isLoggingOut ? t("settings.loggingOut") : t("settings.logout")}
          </button>
        </div>
      )}

      {isEditorOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/80 md:items-center md:p-4"
          onMouseDown={() => setIsEditorOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="flex h-[100dvh] w-full max-w-lg flex-col overflow-hidden bg-card text-card-foreground shadow-2xl shadow-black md:h-auto md:max-h-[calc(100dvh-2rem)] md:rounded-2xl md:border md:border-border"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 p-5 md:border-b-0 md:p-8 md:pb-0">
              <div>
                <h2 id="edit-profile-title" className="text-xl font-bold">
                  {t("settings.editTitle")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("settings.editDescription")}
                </p>
              </div>

              <button
                type="button"
                aria-label={t("common.close")}
                onClick={() => setIsEditorOpen(false)}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            <form
              className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:mt-6 md:p-8 md:pt-0"
              onSubmit={handleProfileUpdate}
            >
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground/75">
                  {t("settings.username")}
                </span>
                <div className={fieldContainerClassName}>
                  <ShineBorder
                    borderWidth="0.125rem"
                    duration={15}
                    shineColor={[
                      "var(--color-breezy-green)",
                      "var(--color-breezy-yellow)",
                      "var(--color-breezy-green)",
                    ]}
                    className="z-20 opacity-0 transition-opacity group-focus-within:opacity-100"
                  />
                  <input
                    autoFocus
                    required
                    value={form.username}
                    onChange={(event) => updateField("username", event.target.value)}
                    className={fieldClassName}
                    autoComplete="username"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground/75">
                  {t("settings.displayName")}
                </span>
                <div className={fieldContainerClassName}>
                  <ShineBorder
                    borderWidth="0.125rem"
                    duration={15}
                    shineColor={[
                      "var(--color-breezy-green)",
                      "var(--color-breezy-yellow)",
                      "var(--color-breezy-green)",
                    ]}
                    className="z-20 opacity-0 transition-opacity group-focus-within:opacity-100"
                  />
                  <input
                    value={form.nickname}
                    onChange={(event) => updateField("nickname", event.target.value)}
                    className={fieldClassName}
                    placeholder={t("settings.displayNamePlaceholder")}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground/75">
                  {t("settings.bio")}
                </span>
                <div className={fieldContainerClassName}>
                  <ShineBorder
                    borderWidth="0.125rem"
                    duration={15}
                    shineColor={[
                      "var(--color-breezy-green)",
                      "var(--color-breezy-yellow)",
                      "var(--color-breezy-green)",
                    ]}
                    className="z-20 opacity-0 transition-opacity group-focus-within:opacity-100"
                  />
                  <textarea
                    value={form.bio}
                    onChange={(event) => updateField("bio", event.target.value)}
                    className={`${fieldClassName} block min-h-28 resize-y`}
                    placeholder={t("settings.bioPlaceholder")}
                  />
                </div>
              </label>

              <div className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground/75">
                  {t("settings.profilePhoto")}
                </span>
                <Dropzone
                  accept={avatarMimeTypes}
                  maxFiles={1}
                  maxSize={avatarMaxSize}
                  multiple={false}
                  disabled={isSaving}
                  onDrop={(files) => {
                    const [file] = files;

                    if (file) {
                      updateSelectedAvatar(file);
                    }
                  }}
                  onReject={() => {
                    notify({
                      tone: "error",
                      title: t("settings.rejectedImageTitle"),
                      description: t("settings.rejectedImageDescription"),
                    });
                  }}
                  className="rounded-xl border border-dashed border-input bg-background p-0 transition-colors hover:border-breezy-green"
                >
                  <div className="flex min-h-36 items-center gap-4 p-4">
                    <div
                      className="flex size-20 shrink-0 items-center justify-center rounded-full bg-breezy-green bg-cover bg-center text-2xl font-bold text-black"
                      style={
                        avatarPreview || form.url_photo
                          ? { backgroundImage: `url(${avatarPreview ?? form.url_photo})` }
                          : undefined
                      }
                      aria-hidden="true"
                    >
                      {!avatarPreview && !form.url_photo && <FiImage aria-hidden="true" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FiUpload className="shrink-0 text-breezy-green" aria-hidden="true" />
                        <span>
                          {selectedAvatar ? selectedAvatar.name : t("settings.dropImage")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("settings.imageHint")}
                      </p>
                    </div>
                  </div>
                </Dropzone>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <RippleButton
                  type="button"
                  rippleColor="var(--foreground)"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  {t("common.cancel")}
                </RippleButton>
                <RippleButton
                  type="submit"
                  disabled={isSaving}
                  rippleColor="var(--color-breezy-black)"
                  className="rounded-full border-0 bg-breezy-green px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-breezy-green/90 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSaving ? t("settings.saving") : t("common.save")}
                </RippleButton>
              </div>
            </form>
          </section>
        </div>,
        document.body,
      )}

      {isSecurityOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/80 md:items-center md:p-4"
          onMouseDown={() => setIsSecurityOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="security-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-card text-card-foreground shadow-2xl shadow-black md:h-auto md:max-h-[calc(100dvh-2rem)] md:rounded-2xl md:border md:border-border"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 p-5 md:border-b-0 md:p-8 md:pb-0">
              <div>
                <h2 id="security-title" className="text-xl font-bold">
                  {t("settings.security")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("settings.securityDescription")}
                </p>
              </div>

              <button
                type="button"
                aria-label={t("common.close")}
                onClick={() => setIsSecurityOpen(false)}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            <form
              className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:mt-6 md:p-8 md:pt-0"
              onSubmit={handlePasswordUpdate}
            >
              <PasswordField
                id="current-password"
                label={t("settings.currentPassword")}
                autoComplete="current-password"
                autoFocus
                value={passwordForm.currentPassword}
                onChange={(currentPassword) =>
                  setPasswordForm((current) => ({ ...current, currentPassword }))
                }
              />
              <PasswordField
                id="new-password"
                label={t("settings.newPassword")}
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(newPassword) =>
                  setPasswordForm((current) => ({ ...current, newPassword }))
                }
              />
              <PasswordField
                id="password-confirmation"
                label={t("settings.confirmNewPassword")}
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
                <RippleButton
                  type="button"
                  rippleColor="var(--foreground)"
                  onClick={() => setIsSecurityOpen(false)}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  {t("common.cancel")}
                </RippleButton>
                <RippleButton
                  type="submit"
                  disabled={isUpdatingPassword}
                  rippleColor="var(--color-breezy-black)"
                  className="rounded-full border-0 bg-breezy-yellow px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-breezy-yellow/90 disabled:cursor-wait disabled:opacity-60"
                >
                  {isUpdatingPassword ? t("settings.updatingPassword") : t("settings.updatePassword")}
                </RippleButton>
              </div>
            </form>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}

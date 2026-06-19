"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEventHandler, type FormEvent } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { loginAction, registerAction } from "@/app/auth/actions";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import { Meteors } from "@/components/ui/meteors";
import { RippleButton } from "@/components/ui/ripple-button";
import { ShineBorder } from "@/components/ui/shine-border";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ThemedLogo } from "@/components/branding/ThemedLogo";

type AuthMode = "login" | "register";

type FieldProps = {
  id: string;
  label: string;
  type?: string;
  autoComplete: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  error?: string;
  pattern?: string;
  minLength?: number;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const logoColors = [
  "var(--color-breezy-green)",
  "var(--color-breezy-yellow)",
  "var(--color-breezy-green)",
];

const fieldClassName =
  "h-full w-full rounded-[inherit] bg-background px-4 text-base text-foreground outline-none placeholder:text-muted-foreground lg:px-5 lg:text-lg";

// Shared animated input used by both authentication modes.
function Field({
  id,
  label,
  type = "text",
  autoComplete,
  value,
  onChange,
  error,
  pattern,
  minLength,
}: FieldProps) {
  const isPasswordField = type === "password";
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputType = isPasswordField && isPasswordVisible ? "text" : type;

  return (
    <div>
      <div
        className={`group relative h-14 rounded-xl border transition-shadow focus-within:border-transparent lg:h-14 2xl:h-16 ${
          error
            ? "border-red-500 focus-within:shadow-[0_0_1.25rem_rgba(239,68,68,0.35)]"
            : "border-[#536471] focus-within:shadow-[0_0_1.25rem_rgba(0,146,62,0.28)]"
        }`}
      >
        <label className="sr-only" htmlFor={id}>
          {label}
        </label>
        <ShineBorder
          borderWidth="0.125rem"
          duration={15}
          shineColor={
            error
              ? ["#ef4444", "#f87171", "#ef4444"]
              : ["#00923e", "#f8c100", "#00923e"]
          }
          className="z-20 opacity-0 transition-opacity group-focus-within:opacity-100"
        />
        <input
          id={id}
          name={id}
          type={inputType}
          autoComplete={autoComplete}
          placeholder={label}
          value={value}
          onChange={onChange}
          pattern={pattern}
          minLength={minLength}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${fieldClassName} ${isPasswordField ? "pr-14" : ""}`}
        />
        {isPasswordField && (
          <button
            type="button"
            aria-label={
              isPasswordVisible
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
          aria-pressed={isPasswordVisible}
          onClick={() => setIsPasswordVisible((visible) => !visible)}
            className="absolute inset-y-0 right-0 z-30 flex w-14 items-center justify-center rounded-r-[inherit] text-xl text-muted-foreground transition-colors hover:text-breezy-green focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-breezy-yellow"
          >
            {isPasswordVisible ? (
              <FiEyeOff aria-hidden="true" />
            ) : (
              <FiEye aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const isLogin = mode === "login";

  // Client-side form state and validation.
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const usernameError =
    !isLogin && hasSubmitted && username.trim().length === 0
      ? "Le nom d’utilisateur est obligatoire."
      : undefined;
  const emailError =
    (hasSubmitted || email.length > 0) && !EMAIL_REGEX.test(email)
      ? "L’adresse e-mail n’est pas valide."
      : undefined;
  const passwordLengthError =
    (hasSubmitted || password.length > 0) && password.length < 8
      ? "Le mot de passe doit contenir au moins 8 caractères."
      : undefined;
  const passwordConfirmationError =
    !isLogin &&
    (hasSubmitted || passwordConfirmation.length > 0) &&
    password !== passwordConfirmation
      ? "Les mots de passe ne correspondent pas."
      : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setHasSubmitted(true);
    setSubmitError(undefined);

    const hasInvalidLoginForm = !EMAIL_REGEX.test(email) || password.length < 8;
    const hasInvalidRegisterForm =
      username.trim().length === 0 ||
      hasInvalidLoginForm ||
      password !== passwordConfirmation;

    if (isLogin ? hasInvalidLoginForm : hasInvalidRegisterForm) {
      notify({
        tone: "error",
        title: "Formulaire incomplet",
        description: "Corrige les champs indiqués avant de continuer.",
      });
      return;
    }

    setIsSubmitting(true);
    const authNotificationId = notify(
      {
        tone: "loading",
        title: isLogin ? "Connexion en cours" : "Création du compte",
        description: "La requête est envoyée au service d'authentification.",
      },
      { duration: null },
    );

    try {
      const result = isLogin
        ? await loginAction({
            email,
            password,
          })
        : await registerAction({
            username: username.trim(),
            email,
            password,
          });

      if (result.status === "error") {
        setSubmitError(result.message);
        notify(
          {
            tone: "error",
            title: "Authentification impossible",
            description: result.message,
          },
          { replaceId: authNotificationId },
        );
        return;
      }

      notify(
        {
          tone: "success",
          title: isLogin ? "Connexion réussie" : "Compte créé",
          description: "Redirection vers Breezyl.",
        },
        { replaceId: authNotificationId },
      );

      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 650);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue.";

      setSubmitError(message);
      notify(
        {
          tone: "error",
          title: "Authentification impossible",
          description: message,
        },
        { replaceId: authNotificationId },
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Fields vary by mode while sharing the same rendering and validation.
  const fields: FieldProps[] = isLogin
    ? [
        {
          id: "email",
          label: "Adresse e-mail",
          type: "email",
          autoComplete: "email",
          value: email,
          onChange: (event) => setEmail(event.target.value),
          pattern: EMAIL_REGEX.source,
          error: emailError,
        },
        {
          id: "password",
          label: "Mot de passe",
          type: "password",
          autoComplete: "current-password",
          value: password,
          onChange: (event) => setPassword(event.target.value),
          minLength: 8,
          error: passwordLengthError,
        },
      ]
    : [
        {
          id: "username",
          label: "Nom d'utilisateur",
          autoComplete: "username",
          value: username,
          onChange: (event) => setUsername(event.target.value),
          error: usernameError,
        },
        {
          id: "email",
          label: "Adresse e-mail",
          type: "email",
          autoComplete: "email",
          value: email,
          onChange: (event) => setEmail(event.target.value),
          pattern: EMAIL_REGEX.source,
          error: emailError,
        },
        {
          id: "password",
          label: "Mot de passe",
          type: "password",
          autoComplete: "new-password",
          value: password,
          onChange: (event) => setPassword(event.target.value),
          minLength: 8,
          error: passwordLengthError,
        },
        {
          id: "passwordConfirmation",
          label: "Confirmer le mot de passe",
          type: "password",
          autoComplete: "new-password",
          value: passwordConfirmation,
          onChange: (event) => setPasswordConfirmation(event.target.value),
          minLength: 8,
          error: passwordConfirmationError,
        },
      ];

  return (
    <main className="relative min-h-svh bg-background px-6 py-5 text-foreground lg:flex lg:h-svh lg:items-center lg:justify-center lg:bg-[url('/auth-background.png')] lg:bg-cover lg:bg-center lg:px-10 lg:py-8 xl:px-16 2xl:px-24">
      <ThemeToggle className="absolute right-5 top-5 z-30 shadow-lg" />
      <div className="relative mx-auto flex min-h-[calc(100svh-40px)] w-full max-w-sm flex-col justify-center overflow-hidden lg:min-h-0 lg:max-w-lg lg:rounded-3xl lg:border lg:border-border lg:bg-background/90 lg:p-10 lg:shadow-2xl xl:max-w-xl xl:p-12 2xl:max-w-2xl 2xl:p-14">
        <div aria-hidden="true" className="absolute inset-0">
          <Meteors
            number={25}
            minDuration={4}
            maxDuration={9}
          />
        </div>

        <div className="relative z-10 flex flex-col">
          {/* Brand header. */}
          <Link
            href="/"
            aria-label="Breezyl - Accueil"
            className="mx-auto inline-flex items-center gap-2 rounded-full p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-breezy-green"
          >
            <ThemedLogo
              size={56}
              className="size-14 rounded-2xl object-cover"
            />
            <DiaTextReveal
              className="inline-block py-1 text-4xl font-bold leading-normal tracking-tight"
              colors={logoColors}
              textColor="var(--foreground)"
              text="Breezyl"
            />
          </Link>

          {/* Authentication form. */}
          <section className="flex flex-col justify-center py-8 lg:py-8 xl:py-10">
            <form
              className="space-y-5 2xl:space-y-6"
              onSubmit={handleSubmit}
              noValidate
            >
              {fields.map((field) => (
                <Field key={field.id} {...field} />
              ))}

              {submitError && (
                <p className="text-sm text-red-400" role="alert">
                  {submitError}
                </p>
              )}

              <RippleButton
                type="submit"
                disabled={isSubmitting}
                rippleColor="#000000"
                className="h-12 w-full rounded-full border-0 bg-foreground px-5 text-base font-bold text-background shadow-sm transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground lg:h-14 lg:bg-breezy-green lg:text-lg lg:text-white lg:shadow-lg lg:shadow-breezy-green/20 lg:hover:bg-[#007f36] lg:focus-visible:outline-breezy-green 2xl:h-16"
              >
                {isLogin ? "Se connecter" : "Créer le compte"}
              </RippleButton>
            </form>
          </section>

          {/* Switch between login and registration. */}
          <p className="text-[15.2px] text-muted-foreground">
            {isLogin
              ? "Vous n’avez pas de compte ?"
              : "Vous avez déjà un compte ?"}{" "}
            <Link
              href={isLogin ? "/register" : "/login"}
              className="text-breezy-green hover:underline"
            >
              {isLogin ? "Inscrivez-vous" : "Connectez-vous"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

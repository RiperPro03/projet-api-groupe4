"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ChangeEventHandler, type FormEvent } from "react";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import { Meteors } from "@/components/ui/meteors";
import { RippleButton } from "@/components/ui/ripple-button";
import { ShineBorder } from "@/components/ui/shine-border";

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
  "h-full w-full rounded-[inherit] bg-black px-4 text-base text-white outline-none placeholder:text-[#71767b]";

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
  return (
    <div>
      <div
        className={`group relative h-14 rounded-xl border transition-shadow focus-within:border-transparent lg:h-12 ${
          error
            ? "border-red-500 focus-within:shadow-[0_0_20px_rgba(239,68,68,0.35)]"
            : "border-[#536471] focus-within:shadow-[0_0_20px_rgba(0,146,62,0.28)]"
        }`}
      >
        <label className="sr-only" htmlFor={id}>
          {label}
        </label>
        <ShineBorder
          borderWidth={2}
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
          type={type}
          autoComplete={autoComplete}
          placeholder={label}
          value={value}
          onChange={onChange}
          pattern={pattern}
          minLength={minLength}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={fieldClassName}
        />
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
  const isLogin = mode === "login";

  // Client-side form state and validation.
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);
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

  // Mobile uses a black background; desktop adds the illustrated backdrop.
  return (
    <main className="min-h-svh bg-breezy-black px-6 py-5 text-white lg:flex lg:h-svh lg:items-center lg:justify-end lg:bg-[url('/auth-background.png')] lg:bg-cover lg:bg-center lg:px-16 lg:py-6">
      <div className="relative mx-auto flex min-h-[calc(100svh-2.5rem)] w-full max-w-sm flex-col justify-center overflow-hidden lg:mx-0 lg:min-h-0 lg:max-w-md lg:justify-start lg:rounded-3xl lg:bg-breezy-black lg:p-8 lg:shadow-2xl">
        {/* Decorative background layer. */}
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
            <Image
              src="/breezy-logo.ico"
              alt=""
              width={42}
              height={42}
              unoptimized
              className="size-14 rounded-2xl object-cover"
            />
            <DiaTextReveal
              className="inline-block py-1 text-4xl font-bold leading-normal tracking-tight"
              colors={logoColors}
              textColor="white"
              text="Breezyl"
            />
          </Link>

          {/* Authentication form. */}
          <section className="flex flex-col justify-center py-8 lg:py-6">
            <form
              className="space-y-5 lg:space-y-4"
              onSubmit={handleSubmit}
              noValidate
            >
              {fields.map((field) => (
                <Field key={field.id} {...field} />
              ))}

              <RippleButton
                type="submit"
                rippleColor="#000000"
                className="h-12 w-full rounded-full border-0 bg-white px-5 text-base font-bold text-black shadow-sm transition hover:bg-[#d7dbdc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:bg-breezy-green lg:text-white lg:shadow-lg lg:shadow-breezy-green/20 lg:hover:bg-[#007f36] lg:focus-visible:outline-breezy-green"
              >
                {isLogin ? "Se connecter" : "Créer le compte"}
              </RippleButton>
            </form>
          </section>

          {/* Switch between login and registration. */}
          <p className="text-[0.95rem] text-[#71767b]">
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

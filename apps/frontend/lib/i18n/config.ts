export const LOCALE_COOKIE_NAME = "breezyl_locale";

export const defaultLocale = "fr";

export const languages = [
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    shortName: "FR",
    dir: "ltr",
    dateLocale: "fr-FR",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    shortName: "EN",
    dir: "ltr",
    dateLocale: "en-US",
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    shortName: "PT",
    dir: "ltr",
    dateLocale: "pt-PT",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    shortName: "ES",
    dir: "ltr",
    dateLocale: "es-ES",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    shortName: "RU",
    dir: "ltr",
    dateLocale: "ru-RU",
  },
] as const;

export type Locale = (typeof languages)[number]["code"];
export type TextDirection = (typeof languages)[number]["dir"];

export const languageByCode = Object.fromEntries(
  languages.map((language) => [language.code, language])
) as Record<Locale, (typeof languages)[number]>;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    languages.some((language) => language.code === value)
  );
}

export function getLanguage(locale: Locale) {
  return languageByCode[locale] ?? languageByCode[defaultLocale];
}

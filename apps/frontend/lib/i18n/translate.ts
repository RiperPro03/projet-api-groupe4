import { defaultLocale, getLanguage, type Locale } from "./config";
import { getDictionary } from "./dictionaries";

type TranslationParams = Record<string, string | number>;

function getValue(source: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, source);
}

function interpolate(template: string, params?: TranslationParams) {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];

    return value === undefined ? match : String(value);
  });
}

export function translate(
  locale: Locale,
  key: string,
  params?: TranslationParams
) {
  const value =
    getValue(getDictionary(locale), key) ??
    getValue(getDictionary(defaultLocale), key);

  return interpolate(typeof value === "string" ? value : key, params);
}

export function getDateLocale(locale: Locale) {
  return getLanguage(locale).dateLocale;
}

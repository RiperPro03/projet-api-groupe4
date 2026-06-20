import { en } from "./en";
import { es } from "./es";
import { fr, type Dictionary } from "./fr";
import { pt } from "./pt";
import { ru } from "./ru";
import { defaultLocale, type Locale } from "../config";
import type { DictionaryOverride } from "./types";

const dictionaryOverrides = {
  fr: {},
  en,
  pt,
  es,
  ru,
} satisfies Record<Locale, DictionaryOverride>;

function mergeDictionary(base: Dictionary, override: DictionaryOverride): Dictionary {
  const merged = { ...base } as Record<string, Record<string, string>>;

  Object.entries(override).forEach(([sectionKey, sectionOverride]) => {
    if (!sectionOverride) {
      return;
    }

    merged[sectionKey] = {
      ...merged[sectionKey],
      ...sectionOverride,
    };
  });

  return merged as Dictionary;
}

export const dictionaries = Object.fromEntries(
  Object.entries(dictionaryOverrides).map(([locale, override]) => [
    locale,
    mergeDictionary(fr, override),
  ])
) as Record<Locale, Dictionary>;

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export type { Dictionary };

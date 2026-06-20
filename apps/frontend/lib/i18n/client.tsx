"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultLocale,
  getLanguage,
  languages,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "./config";
import { getDateLocale, translate } from "./translate";

type I18nContextValue = {
  locale: Locale;
  language: ReturnType<typeof getLanguage>;
  languages: typeof languages;
  dateLocale: string;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function persistLocale(locale: Locale) {
  window.localStorage.setItem(LOCALE_COOKIE_NAME, locale);
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function I18nProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    persistLocale(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = getLanguage(locale).dir;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    persistLocale(nextLocale);
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = getLanguage(nextLocale).dir;
    setLocaleState(nextLocale);
  }, []);

  const contextValue = useMemo<I18nContextValue>(() => {
    const language = getLanguage(locale);

    return {
      locale,
      language,
      languages,
      dateLocale: getDateLocale(locale),
      setLocale,
      t: (key, params) => translate(locale, key, params),
    };
  }, [locale, setLocale]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }

  return context;
}

import { cookies } from "next/headers";
import {
  defaultLocale,
  getLanguage,
  isLocale,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "./config";
import { translate } from "./translate";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  return isLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

export async function getServerI18n() {
  const locale = await getServerLocale();

  return {
    locale,
    language: getLanguage(locale),
    t: (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
  };
}

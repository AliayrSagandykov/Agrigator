import "server-only";
import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { DEFAULT_LOCALE, getDict, isLocale, type Dict, type Locale } from "./i18n";

export const LOCALE_COOKIE = "lang";

// cookies() в Next 14 синхронный → getLocale/getT тоже синхронные.
// noStore() гарантирует, что КАЖДЫЙ переводимый сегмент (а не только layout)
// рендерится динамически и читает cookie локали на каждый запрос — иначе Next
// может пре-рендерить страницу статически на дефолтном языке.
export function getLocale(): Locale {
  noStore();
  const v = cookies().get(LOCALE_COOKIE)?.value ?? "";
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

export function getT(): Dict {
  return getDict(getLocale());
}

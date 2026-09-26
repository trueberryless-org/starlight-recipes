import context from "virtual:starlight-recipes/context";

import {
  type Locale,
  resolveDefaultLocale,
  resolveLangFromLocale,
  resolveLocales,
} from "./i18n";

export const DefaultLocale = resolveDefaultLocale(context);

export function getLocales(): Locale[] {
  return resolveLocales(context);
}

export function getLangFromLocale(locale: Locale): string {
  return resolveLangFromLocale(context, locale);
}

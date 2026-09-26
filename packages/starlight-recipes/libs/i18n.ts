import type { StarlightUserConfig } from "@astrojs/starlight/types";

const StarlightDefaultLang = "en";
const RootLocale = "root";

export function getI18nContext(
  starlightConfig: Pick<StarlightUserConfig, "defaultLocale" | "locales">
): StarlightRecipesI18nContext {
  const { defaultLocale, locales } = starlightConfig;
  const localeKeys = Object.keys(locales ?? {});

  if (!locales || !isLocalizedSite(localeKeys, locales)) {
    return {
      defaultLocale: {
        lang: locales?.root?.lang ?? StarlightDefaultLang,
        locale: undefined,
      },
      isMultilingual: false,
      locales: undefined,
    };
  }

  const defaultLocaleKey = defaultLocale ?? RootLocale;

  return {
    defaultLocale: {
      lang: getLocaleLang(defaultLocaleKey, locales[defaultLocaleKey]?.lang),
      locale: defaultLocale,
    },
    isMultilingual: localeKeys.length > 1,
    locales: Object.fromEntries(
      Object.entries(locales).map(([locale, localeConfig]) => [
        locale,
        { lang: getLocaleLang(locale, localeConfig?.lang) },
      ])
    ),
  };
}

export function resolveDefaultLocale(
  i18nContext: StarlightRecipesI18nContext
): Locale {
  const { locale } = i18nContext.defaultLocale;

  return locale === RootLocale ? undefined : locale;
}

export function resolveLocales(
  i18nContext: StarlightRecipesI18nContext
): Locale[] {
  if (!i18nContext.isMultilingual) return [resolveDefaultLocale(i18nContext)];

  return Object.keys(i18nContext.locales ?? {}).map((locale) =>
    locale === RootLocale ? undefined : locale
  );
}

export function resolveLangFromLocale(
  i18nContext: StarlightRecipesI18nContext,
  locale: Locale
): string {
  const lang = i18nContext.locales?.[locale ?? RootLocale]?.lang;

  return lang ?? i18nContext.defaultLocale.lang;
}

function isLocalizedSite(
  localeKeys: string[],
  locales: NonNullable<StarlightUserConfig["locales"]>
): boolean {
  return (
    localeKeys.length > 1 ||
    (localeKeys.length === 1 && locales[RootLocale] === undefined)
  );
}

function getLocaleLang(locale: string, lang: string | undefined): string {
  return lang ?? (locale === RootLocale ? StarlightDefaultLang : locale);
}

export interface StarlightRecipesI18nContext {
  defaultLocale: {
    lang: string;
    locale: string | undefined;
  };
  isMultilingual: boolean;
  locales: Record<string, { lang: string }> | undefined;
}

export type Locale = string | undefined;

import type { GetStaticPathsResult } from "astro";
import { slug } from "github-slugger";
import config from "virtual:starlight-recipes-config";
import starlightConfig from "virtual:starlight/user-config";

import { type StarlightRecipeEntry, getRecipeEntries } from "./content";
import { DefaultLocale, type Locale } from "./i18n";
import { getPathWithLocale } from "./page";

const getFlagEmoji = (isoCode: string): string | null => {
  if (!/^[A-Z]{2}$/.test(isoCode.toUpperCase())) return null;

  return isoCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
};

export const resolveCuisine = (
  input: string | undefined,
  locale: string = "en"
): StarlightRecipeEntryCuisine | undefined => {
  if (input === undefined) return input;

  try {
    const displayNames = new Intl.DisplayNames([locale], {
      type: "region",
      fallback: "code",
    });

    const localizedName = displayNames.of(input);

    if (
      (localizedName && localizedName !== input) ||
      /^[A-Z]{2}$/.test(input)
    ) {
      const flag = getFlagEmoji(input);
      return {
        slug: slug(localizedName || input),
        name: localizedName || input,
        flag: flag,
        label: flag ? `${localizedName} ${flag}` : localizedName || input,
        isCountry: true,
      };
    }
  } catch (e) {}

  return {
    slug: slug(input),
    name: input,
    flag: null,
    label: input,
    isCountry: false,
  };
};

export async function getAllCuisines(
  locale: Locale
): Promise<StarlightRecipeEntryCuisines> {
  const entries = await getRecipeEntries(locale);
  const entryCuisines: StarlightRecipeEntryCuisines = new Map();

  for (const entry of entries) {
    const cuisine = resolveCuisine(entry.data.cuisine);
    if (cuisine === undefined) continue;
    const infos = entryCuisines.get(cuisine.slug) ?? {
      entries: [],
      label: cuisine.label,
    };

    infos.entries.push(entry);

    entryCuisines.set(cuisine.slug, infos);
  }

  return entryCuisines;
}

export async function getCuisinesStaticPaths() {
  const paths = [];

  if (starlightConfig.isMultilingual) {
    for (const localeKey of Object.keys(starlightConfig.locales)) {
      const locale = localeKey === "root" ? undefined : localeKey;

      const entryCuisines = await getAllCuisines(locale);

      for (const [slug, { entries, label }] of entryCuisines.entries()) {
        paths.push(getCuisinesStaticPath(entries, slug, label, locale));
      }
    }
  } else {
    const entryCuisines = await getAllCuisines(DefaultLocale);

    for (const [slug, { entries, label }] of entryCuisines.entries()) {
      paths.push(getCuisinesStaticPath(entries, slug, label, DefaultLocale));
    }
  }

  return paths satisfies GetStaticPathsResult;
}

function getCuisinesStaticPath(
  entries: StarlightRecipeEntry[],
  slug: string,
  label: string,
  locale: Locale
) {
  return {
    params: {
      prefix: getPathWithLocale(config.prefix, locale),
      cuisine: slug,
    },
    props: {
      entries,
      label,
      locale,
      cuisine: slug,
    },
  };
}

type StarlightRecipeEntryCuisineSlug = string;

type StarlightRecipeEntryCuisines = Map<
  StarlightRecipeEntryCuisineSlug,
  {
    entries: StarlightRecipeEntry[];
    label: StarlightRecipeEntryCuisine["label"];
  }
>;

export type StarlightRecipeEntryCuisine = {
  /** The lowercase version of the name, ideal for URL paths. */
  slug: string;
  /** The localized country name or the raw input string. */
  name: string;
  /** The emoji flag string (e.g., "🇺🇸") or null if not a country code. */
  flag: string | null;
  /** The name and flag combined (e.g., "United States 🇺🇸") or just the name. */
  label: string;
  /** Whether the input was successfully resolved as an ISO country code. */
  isCountry: boolean;
};

import {
  type StarlightRouteData,
  defineRouteMiddleware,
} from "@astrojs/starlight/route-data";
import type { APIContext, AstroBuiltinAttributes } from "astro";
import type { HTMLAttributes } from "astro/types";

import type { StarlightRecipesData } from "./data";
import { getAllAuthors, getEntryAuthors } from "./libs/authors";
import { getRecipeEntries, getSidebarRecipeEntries } from "./libs/content";
import type { Locale } from "./libs/i18n";
import {
  getPathWithLocale,
  getRelativeRecipeUrl,
  getRelativeUrl,
  getSidebarProps,
  isAnyRecipeRootPage,
  isAnyRecipesPage,
  isRecipeAuthorPage,
  isRecipeRoot,
  isRecipeTagPage,
} from "./libs/page";
import { getAllTags, getEntryTags } from "./libs/tags";

const recipeDataPerLocale = new Map<Locale, StarlightRecipesData>();

export const onRequest = defineRouteMiddleware(async (context) => {
  const { starlightRoute } = context.locals;
  const { id } = starlightRoute;

  context.locals.starlightRecipes = await getRecipesData(
    starlightRoute,
    context.locals.t
  );

  const isRecipe = isAnyRecipesPage(id);
  if (!isRecipe) return;

  const isRecipeOverviewPage = isAnyRecipeRootPage(id);
  if (isRecipeOverviewPage) starlightRoute.toc = undefined;

  starlightRoute.head.push();
  starlightRoute.sidebar = await getRecipeSidebar(context);
});

export async function getRecipesData(
  { locale }: StarlightRouteData,
  t: App.Locals["t"]
): Promise<StarlightRecipesData> {
  if (recipeDataPerLocale.has(locale)) {
    return recipeDataPerLocale.get(locale) as StarlightRecipesData;
  }

  const recipes = await getRecipeEntriesData(locale, t);

  const authors = new Map<string, StarlightRecipesData["authors"][number]>();

  for (const recipe of recipes) {
    for (const author of recipe.authors) {
      if (authors.has(author.name)) continue;
      authors.set(author.name, author);
    }
  }

  const recipeData: StarlightRecipesData = {
    recipes,
    authors: [...authors.values()],
  };

  recipeDataPerLocale.set(locale, recipeData);

  return recipeData;
}

async function getRecipeEntriesData(
  locale: Locale,
  t: App.Locals["t"]
): Promise<StarlightRecipesData["recipes"]> {
  const entries = await getRecipeEntries(locale);

  return Promise.all(
    entries.map(async (entry) => {
      const authors = getEntryAuthors(entry);
      const tags = getEntryTags(entry);

      const recipesData: StarlightRecipesData["recipes"][number] = {
        authors: authors.map(({ name, title, url }) => ({
          name,
          title,
          url,
        })),
        cover: entry.data.cover,
        createdAt: entry.data.date,
        draft: entry.data.draft,
        entry: entry,
        featured: entry.data.featured === true,
        href: getRelativeUrl(`/${getPathWithLocale(entry.id, locale)}`),
        tags: tags.map(({ label, slug }) => ({
          label,
          href: getRelativeRecipeUrl(`/tags/${slug}`, locale),
        })),
        title: entry.data.title,
      };

      if (
        entry.data.lastUpdated &&
        typeof entry.data.lastUpdated !== "boolean"
      ) {
        recipesData.updatedAt = entry.data.lastUpdated;
      }

      return recipesData;
    })
  );
}

async function getRecipeSidebar(
  context: APIContext
): Promise<StarlightRouteData["sidebar"]> {
  const { starlightRoute, t } = context.locals;
  const { id, locale } = starlightRoute;

  const { featured, recent } = await getSidebarRecipeEntries(locale);

  const sidebar: StarlightRouteData["sidebar"] = [
    makeSidebarLink(
      t("starlightRecipes.sidebar.all"),
      getRelativeRecipeUrl("/", locale),
      isRecipeRoot(id)
    ),
  ];

  if (featured.length > 0) {
    sidebar.push(
      makeSidebarGroup(
        t("starlightRecipes.sidebar.featured"),
        getSidebarProps(id, featured, locale)
      )
    );
  }

  if (recent.length > 0) {
    sidebar.push(
      makeSidebarGroup(
        t("starlightRecipes.sidebar.recent"),
        getSidebarProps(id, recent, locale)
      )
    );
  }

  const tags = await getAllTags(locale);

  if (tags.size > 0) {
    sidebar.push(
      makeSidebarGroup(
        t("starlightRecipes.sidebar.tags"),
        [...tags]
          .sort(([, a], [, b]) => {
            if (a.entries.length === b.entries.length) {
              return a.label.localeCompare(b.label);
            }

            return b.entries.length - a.entries.length;
          })
          .map(([tagSlug, { entries, label }]) =>
            makeSidebarLink(
              `${label} (${entries.length})`,
              getRelativeRecipeUrl(`/tags/${tagSlug}`, locale),
              isRecipeTagPage(id, tagSlug)
            )
          )
      )
    );
  }

  const authors = await getAllAuthors(locale);

  if (authors.size > 1) {
    sidebar.push(
      makeSidebarGroup(
        t("starlightRecipes.sidebar.authors"),
        [...authors]
          .sort(([, a], [, b]) => {
            if (a.entries.length === b.entries.length) {
              return a.author.name.localeCompare(b.author.name);
            }

            return b.entries.length - a.entries.length;
          })
          .map(([, { author, entries }]) =>
            makeSidebarLink(
              `${author.name} (${entries.length})`,
              getRelativeRecipeUrl(`/authors/${author.slug}`, locale),
              isRecipeAuthorPage(id, author.slug)
            )
          )
      )
    );
  }

  return sidebar;
}

function makeSidebarLink(
  label: string,
  href: string,
  isCurrent: boolean,
  attributes?: Omit<
    HTMLAttributes<"a">,
    keyof AstroBuiltinAttributes | "children"
  >
) {
  return {
    attrs: attributes ?? {},
    badge: undefined,
    href,
    isCurrent,
    label,
    type: "link",
  } satisfies StarlightRouteData["sidebar"][number];
}

function makeSidebarGroup(
  label: string,
  entries: StarlightRouteData["sidebar"]
) {
  return {
    badge: undefined,
    collapsed: false,
    entries,
    label,
    type: "group",
  } satisfies StarlightRouteData["sidebar"][number];
}

import { test as base } from "@playwright/test";

import { AuthorsPage } from "./fixtures/AuthorsPage";
import { RecipesPage } from "./fixtures/RecipesPage";
import { TagsPage } from "./fixtures/TagsPage";

export { expect } from "@playwright/test";

export const test = base.extend<Fixtures>({
  authorsPage: async ({ page }, use) => {
    const authorsPage = new AuthorsPage(page);
    await use(authorsPage);
  },
  recipesPage: async ({ page }, use) => {
    const recipesPage = new RecipesPage(page);
    await use(recipesPage);
  },
  tagsPage: async ({ page }, use) => {
    const tagsPage = new TagsPage(page);
    await use(tagsPage);
  },
});

interface Fixtures {
  authorsPage: AuthorsPage;
  recipesPage: RecipesPage;
  tagsPage: TagsPage;
}

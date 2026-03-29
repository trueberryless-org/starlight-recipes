import { expect, test } from "./test";

test("should create localized recipe list pages", async ({ recipesPage }) => {
  let response = await recipesPage.goto(undefined, "de");

  expect(response?.ok()).toBe(true);

  response = await recipesPage.goto(2, "de");

  expect(response?.ok()).toBe(true);
});

test("should localize the sidebar all recipes link", async ({ recipesPage }) => {
  await recipesPage.goto(undefined, "de");

  const link = recipesPage.sidebar.getByRole("link", { name: "Alle Rezepte" });

  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/de/recipes/");
});


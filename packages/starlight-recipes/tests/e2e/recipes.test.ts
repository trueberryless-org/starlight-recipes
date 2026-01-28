import { expect, test } from "./test";

test("should create the recipe list pages", async ({ recipesPage }) => {
  let response = await recipesPage.goto();

  expect(response?.ok()).toBe(true);

  response = await recipesPage.goto(1);

  expect(response?.ok()).toBe(false);

  response = await recipesPage.goto(2);

  expect(response?.ok()).toBe(true);

  response = await recipesPage.goto(3);

  expect(response?.ok()).toBe(true);

  response = await recipesPage.goto(4);

  expect(response?.ok()).toBe(false);
});

test("should display pagination links", async ({ recipesPage }) => {
  await recipesPage.goto();

  await expect(recipesPage.prevLink).not.toBeVisible();
  await expect(recipesPage.nextLink).toBeVisible();

  await recipesPage.goto(2);

  await expect(recipesPage.prevLink).toBeVisible();
  await expect(recipesPage.nextLink).toBeVisible();

  await recipesPage.goto(3);

  await expect(recipesPage.prevLink).toBeVisible();
  await expect(recipesPage.nextLink).not.toBeVisible();
});

test("should add an all recipes link to the sidebar", async ({ recipesPage }) => {
  await recipesPage.goto();

  const link = recipesPage.sidebar.getByRole("link", { name: "All recipes" });

  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/recipes/");
});


import { expect, test } from "./test";

test("should create the tag page", async ({ tagsPage }) => {
  const response = await tagsPage.goto("sweet");

  expect(response?.ok()).toBe(true);

  await expect(tagsPage.content.getByRole("heading", { level: 1 })).toContainText(
    "Sweet"
  );
});

test("tag pill links on recipe pages should include the /tags/ prefix", async ({ page }) => {
  // avocado-toast has tags: Savory, Vegetarian
  await page.goto("/recipes/avocado-toast");

  await expect(page.locator('a[href="/recipes/tags/savory/"]')).toBeVisible();
  await expect(page.locator('a[href="/recipes/tags/vegetarian/"]')).toBeVisible();
});


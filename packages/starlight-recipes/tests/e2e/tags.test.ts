import { expect, test } from "./test";

test("should create the tag page", async ({ tagsPage }) => {
  const response = await tagsPage.goto("sweet");

  expect(response?.ok()).toBe(true);

  await expect(tagsPage.content.getByRole("heading", { level: 1 })).toContainText(
    "Sweet"
  );
});


import { expect, test } from "./test";

test("should create the author page", async ({ authorsPage }) => {
  const response = await authorsPage.goto("felix-schneider");

  expect(response?.ok()).toBe(true);

  await expect(
    authorsPage.content.getByRole("heading", { level: 1 })
  ).toContainText("Felix Schneider");
});


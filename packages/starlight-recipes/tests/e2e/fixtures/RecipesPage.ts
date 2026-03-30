import type { Page } from "@playwright/test";

import { BasePage } from "./BasePage";

export class RecipesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  goto(index?: number, locale?: string) {
    return this.page.goto(
      `/${locale ? `${encodeURIComponent(locale)}/` : ""}recipes${index !== undefined ? `/${encodeURIComponent(index)}` : ""}`
    );
  }

  get nextLink() {
    return this.page.getByRole("link", { name: "Further recipes" });
  }

  get prevLink() {
    return this.page.getByRole("link", { name: "Prior recipes" });
  }
}

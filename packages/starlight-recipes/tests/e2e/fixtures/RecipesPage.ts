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
    return this.content.locator('[rel="next"]');
  }

  get prevLink() {
    return this.content.locator('[rel="prev"]');
  }
}

import type { Page } from "@playwright/test";

import { BasePage } from "./BasePage";

export class AuthorsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  goto(author: string, locale?: string) {
    return this.page.goto(
      `/${locale ? `${encodeURIComponent(locale)}/` : ""}recipes/authors/${encodeURIComponent(author)}`
    );
  }
}

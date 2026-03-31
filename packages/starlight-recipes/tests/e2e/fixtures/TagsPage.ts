import type { Page } from "@playwright/test";

import { BasePage } from "./BasePage";

export class TagsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  goto(tag: string, locale?: string) {
    return this.page.goto(
      `/${locale ? `${encodeURIComponent(locale)}/` : ""}recipes/tags/${encodeURIComponent(tag)}`
    );
  }
}

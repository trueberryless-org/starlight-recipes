import { describe, expect, test, vi } from 'vitest'

import { getRelativeRecipeUrl } from '../../../libs/page'

vi.mock("virtual:starlight-recipes-config", () => ({
  default: {
    prefix: "cookbook",
  },
}));

vi.mock("virtual:starlight-recipes-context", () => ({
  default: {
    trailingSlash: "ignore",
  },
}));

vi.mock("virtual:starlight/user-config", () => ({
  default: {
    isMultilingual: false,
    defaultLocale: {
      locale: undefined,
      lang: "en",
    },
    locales: {},
  },
}));

describe('getRelativeRecipeUrl', () => {
  test('returns the recipes root path', () => {
    expect(getRelativeRecipeUrl('/', undefined)).toBe('/cookbook/')
    expect(getRelativeRecipeUrl('/', 'de')).toBe('/de/cookbook/')
  })

  test('returns a recipe path', () => {
    expect(getRelativeRecipeUrl('/recipe-1', undefined)).toBe('/cookbook/recipe-1/')
    expect(getRelativeRecipeUrl('/recipe-1', 'de')).toBe('/de/cookbook/recipe-1/')
  })
})

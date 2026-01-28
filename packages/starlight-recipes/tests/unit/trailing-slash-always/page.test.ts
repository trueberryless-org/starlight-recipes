import { describe, expect, test, vi } from 'vitest'

import { getRelativeRecipeUrl, getRelativeUrl } from '../../../libs/page'

vi.mock("virtual:starlight-recipes-config", () => ({
  default: {
    prefix: "recipes",
  },
}));

vi.mock("virtual:starlight-recipes-context", () => ({
  default: {
    trailingSlash: "always",
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
    expect(getRelativeRecipeUrl('/', undefined)).toBe('/recipes/')
    expect(getRelativeRecipeUrl('/', 'de')).toBe('/de/recipes/')
  })

  test('returns a recipe path', () => {
    expect(getRelativeRecipeUrl('/recipe-1', undefined)).toBe('/recipes/recipe-1/')
    expect(getRelativeRecipeUrl('/recipe-1', 'de')).toBe('/de/recipes/recipe-1/')
  })
})

describe('getRelativeUrl', () => {
  describe('trailingSlash', () => {
    test('does not strip trailing slashes', () => {
      expect(getRelativeUrl('/recipes/')).toBe('/recipes/')
    })

    test('ensures trailing slashes', () => {
      expect(getRelativeUrl('/recipes')).toBe('/recipes/')
    })
  })
})

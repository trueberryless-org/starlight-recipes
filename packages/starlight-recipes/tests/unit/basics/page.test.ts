import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { getRelativeRecipeUrl, getRelativeUrl } from '../../../libs/page'

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
  describe('with no base', () => {
    test('returns the path with no base', () => {
      expect(getRelativeUrl('/recipes')).toBe('/recipes/')
    })

    test('prefixes the path with a leading slash if needed', () => {
      expect(getRelativeUrl('recipes')).toBe('/recipes/')
    })
  })

  describe('with a base', () => {
    beforeEach(() => {
      vi.stubEnv('BASE_URL', '/base/')
      vi.resetModules()
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    test('returns the path prefixed with the base', async () => {
      const { getRelativeUrl } = await import('../../../libs/page')
      expect(getRelativeUrl('/recipes')).toBe('/base/recipes/')
    })
  })

  describe('trailingSlash', () => {
    test('does not strip trailing slashes', () => {
      expect(getRelativeUrl('/recipes/')).toBe('/recipes/')
    })

    test('ensures trailing slashes', () => {
      expect(getRelativeUrl('/recipes')).toBe('/recipes/')
    })
  })
})

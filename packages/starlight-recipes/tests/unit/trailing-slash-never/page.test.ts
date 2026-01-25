import { describe, expect, test } from 'vitest'

import { getRelativeRecipeUrl, getRelativeUrl } from '../../../libs/page'

describe('getRelativeRecipeUrl', () => {
  test('returns the recipes root path', () => {
    expect(getRelativeRecipeUrl('/', undefined)).toBe('/recipes')
    expect(getRelativeRecipeUrl('/', 'de')).toBe('/de/recipes')
  })

  test('returns a recipe path', () => {
    expect(getRelativeRecipeUrl('/recipe-1/', undefined)).toBe('/recipes/recipe-1')
    expect(getRelativeRecipeUrl('/recipe-1/', 'de')).toBe('/de/recipes/recipe-1')
  })
})

describe('getRelativeUrl', () => {
  describe('trailingSlash', () => {
    test('strips trailing slashes', () => {
      expect(getRelativeUrl('/recipes/')).toBe('/recipes')
    })

    test('does not ensure trailing slashes', () => {
      expect(getRelativeUrl('/recipes')).toBe('/recipes')
    })
  })
})

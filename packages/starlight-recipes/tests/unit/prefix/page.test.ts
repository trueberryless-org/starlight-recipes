import { describe, expect, test } from 'vitest'

import { getRelativeRecipeUrl } from '../../../libs/page'

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

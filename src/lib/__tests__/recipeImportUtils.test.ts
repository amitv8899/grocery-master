import { validateRecipeJSON } from '../recipeImportUtils'

const validIngredient = { name: 'Milk', count: 2, priority: 'normal' }
const validRecipe = { name: 'Breakfast', ingredients: [validIngredient] }

describe('validateRecipeJSON — valid inputs', () => {
  it('accepts single valid recipe', () => {
    const result = validateRecipeJSON([validRecipe])
    expect(result.errors).toHaveLength(0)
    expect(result.recipes).toHaveLength(1)
  })

  it('accepts multiple valid recipes', () => {
    const result = validateRecipeJSON([validRecipe, { name: 'B', ingredients: [validIngredient] }, { name: 'C', ingredients: [validIngredient] }])
    expect(result.errors).toHaveLength(0)
    expect(result.recipes).toHaveLength(3)
  })

  it('defaults label to null when omitted', () => {
    const result = validateRecipeJSON([{ name: 'A', ingredients: [{ name: 'Milk', count: 1, priority: 'normal' }] }])
    expect(result.errors).toHaveLength(0)
    expect(result.recipes[0].ingredients[0].label).toBeNull()
  })

  it('defaults priority to normal when omitted', () => {
    const result = validateRecipeJSON([{ name: 'A', ingredients: [{ name: 'Milk', count: 1 }] }])
    expect(result.errors).toHaveLength(0)
    expect(result.recipes[0].ingredients[0].priority).toBe('normal')
  })

  it('silently ignores unknown extra fields', () => {
    const result = validateRecipeJSON([{ name: 'A', servings: 4, ingredients: [{ name: 'Milk', count: 1, priority: 'normal', extra: true }] }])
    expect(result.errors).toHaveLength(0)
    expect(result.recipes).toHaveLength(1)
  })
})

describe('validateRecipeJSON — invalid top-level', () => {
  it('rejects plain object', () => {
    const result = validateRecipeJSON({})
    expect(result.errors[0].message).toBe('JSON must be an array of recipes')
    expect(result.errors[0].recipeIndex).toBe(-1)
  })

  it('rejects string', () => {
    const result = validateRecipeJSON('hello')
    expect(result.errors[0].message).toBe('JSON must be an array of recipes')
  })
})

describe('validateRecipeJSON — invalid recipes', () => {
  it('errors when name missing', () => {
    const result = validateRecipeJSON([{ ingredients: [validIngredient] }])
    expect(result.errors[0].message).toBe('recipe #1 missing name')
  })

  it('errors when name is empty string', () => {
    const result = validateRecipeJSON([{ name: '', ingredients: [validIngredient] }])
    expect(result.errors[0].message).toBe('recipe #1 name cannot be empty')
  })

  it('errors when name is not a string (number)', () => {
    const result = validateRecipeJSON([{ name: 123, ingredients: [validIngredient] }])
    expect(result.errors[0].message).toBe('recipe #1 missing name')
  })

  it('errors when ingredients missing', () => {
    const result = validateRecipeJSON([{ name: 'A' }])
    expect(result.errors[0].message).toBe('recipe #1 missing ingredients array')
  })

  it('errors when ingredients is empty array', () => {
    const result = validateRecipeJSON([{ name: 'A', ingredients: [] }])
    expect(result.errors[0].message).toBe('recipe #1 must have at least one ingredient')
  })
})

describe('validateRecipeJSON — invalid ingredients', () => {
  function makeRecipe(ing: object) {
    return [{ name: 'A', ingredients: [ing] }]
  }

  it('errors when ingredient name missing', () => {
    const result = validateRecipeJSON(makeRecipe({ count: 1, priority: 'normal' }))
    expect(result.errors[0].message).toBe('recipe #1 ingredient #1 missing name')
  })

  it('errors when ingredient name is empty', () => {
    const result = validateRecipeJSON(makeRecipe({ name: '', count: 1, priority: 'normal' }))
    expect(result.errors[0].message).toBe('recipe #1 ingredient #1 missing name')
  })

  it('errors when count is 0', () => {
    const result = validateRecipeJSON(makeRecipe({ name: 'Milk', count: 0, priority: 'normal' }))
    expect(result.errors[0].message).toBe('recipe #1 ingredient #1 count must be ≥ 1')
  })

  it('errors when count is negative', () => {
    const result = validateRecipeJSON(makeRecipe({ name: 'Milk', count: -1, priority: 'normal' }))
    expect(result.errors[0].message).toBe('recipe #1 ingredient #1 count must be ≥ 1')
  })

  it('errors when count is a string', () => {
    const result = validateRecipeJSON(makeRecipe({ name: 'Milk', count: '2', priority: 'normal' }))
    expect(result.errors[0].message).toBe('recipe #1 ingredient #1 count must be ≥ 1')
  })

  it('errors when priority is invalid', () => {
    const result = validateRecipeJSON(makeRecipe({ name: 'Milk', count: 1, priority: 'urgent' }))
    expect(result.errors[0].message).toBe('recipe #1 ingredient #1 priority must be low, normal, or high')
  })

  it('errors when label is wrong type', () => {
    const result = validateRecipeJSON(makeRecipe({ name: 'Milk', count: 1, priority: 'normal', label: 123 }))
    expect(result.errors[0].message).toBe('recipe #1 ingredient #1 label must be a string or null')
  })
})

describe('validateRecipeJSON — error collection', () => {
  it('collects all errors from multiple bad recipes', () => {
    const result = validateRecipeJSON([
      { name: '', ingredients: [validIngredient] },
      { name: 'B', ingredients: [] },
    ])
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
    expect(result.recipes).toHaveLength(0)
  })
})

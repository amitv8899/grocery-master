import type { ValidationResult, ValidationError, RecipeImport, Ingredient } from './types'

const VALID_PRIORITIES = new Set(['low', 'normal', 'high'])

export function validateRecipeJSON(raw: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!Array.isArray(raw)) {
    return { recipes: [], errors: [{ recipeIndex: -1, message: 'JSON must be an array of recipes' }] }
  }

  const recipes: RecipeImport[] = []

  for (let ri = 0; ri < raw.length; ri++) {
    const r = raw[ri]
    const n = ri + 1
    let recipeValid = true

    if (typeof r.name !== 'string' || r.name === undefined || r.name === null) {
      errors.push({ recipeIndex: ri, message: `recipe #${n} missing name` })
      recipeValid = false
    } else if (r.name.trim() === '') {
      errors.push({ recipeIndex: ri, message: `recipe #${n} name cannot be empty` })
      recipeValid = false
    }

    if (!Array.isArray(r.ingredients)) {
      errors.push({ recipeIndex: ri, message: `recipe #${n} missing ingredients array` })
      recipeValid = false
    } else if (r.ingredients.length === 0) {
      errors.push({ recipeIndex: ri, message: `recipe #${n} must have at least one ingredient` })
      recipeValid = false
    } else {
      for (let ii = 0; ii < r.ingredients.length; ii++) {
        const ing = r.ingredients[ii]
        const m = ii + 1

        if (typeof ing.name !== 'string' || ing.name === undefined || ing.name === null || ing.name.trim() === '') {
          errors.push({ recipeIndex: ri, ingredientIndex: ii, message: `recipe #${n} ingredient #${m} missing name` })
          recipeValid = false
        }

        if (typeof ing.count !== 'number' || !Number.isInteger(ing.count) || ing.count < 1) {
          errors.push({ recipeIndex: ri, ingredientIndex: ii, message: `recipe #${n} ingredient #${m} count must be ≥ 1` })
          recipeValid = false
        }

        if (ing.priority !== undefined && !VALID_PRIORITIES.has(ing.priority)) {
          errors.push({ recipeIndex: ri, ingredientIndex: ii, message: `recipe #${n} ingredient #${m} priority must be low, normal, or high` })
          recipeValid = false
        }

        if (ing.label !== undefined && ing.label !== null && typeof ing.label !== 'string') {
          errors.push({ recipeIndex: ri, ingredientIndex: ii, message: `recipe #${n} ingredient #${m} label must be a string or null` })
          recipeValid = false
        }
      }
    }

    if (recipeValid && Array.isArray(r.ingredients) && r.ingredients.length > 0) {
      const ingredients: Ingredient[] = r.ingredients.map((ing: Record<string, unknown>) => ({
        name: (ing.name as string).trim(),
        count: ing.count as number,
        priority: (ing.priority as 'low' | 'normal' | 'high') ?? 'normal',
        label: ing.label !== undefined ? (ing.label as string | null) : null,
      }))
      recipes.push({ name: (r.name as string).trim(), ingredients })
    }
  }

  if (errors.length > 0) return { recipes: [], errors }
  return { recipes, errors: [] }
}

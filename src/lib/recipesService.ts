import { supabase } from './supabaseClient'
import type { Recipe, Ingredient, Item, RecipeImport, ImportResult } from './types'
import { addItem, updateItem } from './itemsService'

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addRecipe(data: { name: string; ingredients: Ingredient[] }): Promise<Recipe> {
  const { data: recipe, error } = await supabase
    .from('recipes')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return recipe
}

export async function updateRecipe(
  id: string,
  data: { name?: string; ingredients?: Ingredient[] }
): Promise<Recipe> {
  const { data: recipe, error } = await supabase
    .from('recipes')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return recipe
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

function mergeIngredients(existing: Ingredient[], incoming: Ingredient[]): Ingredient[] {
  const result: Ingredient[] = existing.map((e) => ({ ...e }))
  for (const ing of incoming) {
    const idx = result.findIndex(
      (e) => e.name.trim().toLowerCase() === ing.name.trim().toLowerCase()
    )
    if (idx !== -1) {
      result[idx] = { ...result[idx], count: result[idx].count + ing.count }
    } else {
      result.push({ ...ing })
    }
  }
  return result
}

export async function importRecipes(
  validated: RecipeImport[],
  existingRecipes: Recipe[]
): Promise<ImportResult> {
  const results: ImportResult = { imported: [], merged: [], failed: [] }

  for (let index = 0; index < validated.length; index++) {
    const recipeImport = validated[index]
    const existingMatch = existingRecipes.find(
      (r) => r.name.trim().toLowerCase() === recipeImport.name.trim().toLowerCase()
    )
    try {
      if (existingMatch) {
        const mergedIngredients = mergeIngredients(existingMatch.ingredients, recipeImport.ingredients)
        const updated = await updateRecipe(existingMatch.id, { ingredients: mergedIngredients })
        results.merged.push(updated)
      } else {
        const inserted = await addRecipe({ name: recipeImport.name, ingredients: recipeImport.ingredients })
        results.imported.push(inserted)
      }
    } catch (err) {
      results.failed.push({
        index,
        name: recipeImport.name,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return results
}

export async function addRecipeToList(recipe: Recipe, currentItems: Item[]): Promise<Item[]> {
  const results: Item[] = []
  for (const ingredient of recipe.ingredients) {
    const candidate = currentItems.find(
      (i) =>
        i.deleted_at === null &&
        i.name.trim().toLowerCase() === ingredient.name.trim().toLowerCase()
    )
    if (candidate) {
      const updated = await updateItem(candidate.id, { count: ingredient.count, checked: false })
      results.push(updated)
    } else {
      const inserted = await addItem({
        name: ingredient.name.trim(),
        count: ingredient.count,
        priority: ingredient.priority,
        label: ingredient.label?.trim() || null,
      })
      results.push(inserted)
    }
  }
  return results
}

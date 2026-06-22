import { supabase } from './supabaseClient'
import type { Recipe, Ingredient, Item } from './types'
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

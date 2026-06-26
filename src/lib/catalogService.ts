import { supabase } from './supabaseClient'

export async function lookupCatalog(itemName: string): Promise<string | null> {
  const key = itemName.trim().toLowerCase()
  if (!key) return null
  const { data, error } = await supabase
    .from('item_catalog')
    .select('tag_name')
    .eq('name', key)
    .maybeSingle()
  if (error) throw error
  return data?.tag_name ?? null
}

export async function upsertCatalog(itemName: string, tagName: string): Promise<void> {
  const key = itemName.trim().toLowerCase()
  if (!key) return
  const { error } = await supabase
    .from('item_catalog')
    .upsert({ name: key, tag_name: tagName, updated_at: new Date().toISOString() }, { onConflict: 'name' })
  if (error) throw error
}

import { supabase } from './supabaseClient'
import type { Item, Priority } from './types'

export async function fetchItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addItem(data: {
  name: string
  count: number
  priority: Priority
  label: string | null
}): Promise<Item> {
  const { data: item, error } = await supabase
    .from('items')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return item
}

export async function updateItem(
  id: string,
  data: Partial<Pick<Item, 'name' | 'count' | 'priority' | 'label'>>
): Promise<Item> {
  const { data: item, error } = await supabase
    .from('items')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return item
}

export async function checkItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ checked: true })
    .eq('id', id)
  if (error) throw error
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function clearBoughtItems(): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('checked', true)
    .is('deleted_at', null)
  if (error) throw error
}

import type { Item } from './types'
import { getTagByName } from './tags'

const PRIORITY_ORDER = { high: 0, normal: 1, low: 2 } as const

export type LabelGroup = {
  label: string
  items: Item[]
}

export type GroupItemsResult = {
  groups: LabelGroup[]
  boughtItems: Item[]
}

export function groupItems(items: Item[]): GroupItemsResult {
  const active = items.filter((i) => !i.checked && i.deleted_at === null)
  const bought = items
    .filter((i) => i.checked && i.deleted_at === null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const groupMap = new Map<string | null, Item[]>()
  for (const item of active) {
    const key = item.label ?? null
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(item)
  }

  const sortItems = (arr: Item[]) =>
    [...arr].sort((a, b) => {
      const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (pd !== 0) return pd
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

  const groups: LabelGroup[] = []

  const nullItems = groupMap.get(null)
  groupMap.delete(null)

  const labelEntries = Array.from(groupMap.entries()) as [string, Item[]][]

  const knownGroups = labelEntries
    .filter(([label]) => getTagByName(label) !== null)
    .sort(([a], [b]) => getTagByName(a)!.sortOrder - getTagByName(b)!.sortOrder)

  const unknownGroups = labelEntries
    .filter(([label]) => getTagByName(label) === null)
    .sort(([a], [b]) => a.localeCompare(b))

  for (const [label, labelItems] of [...knownGroups, ...unknownGroups]) {
    groups.push({ label, items: sortItems(labelItems) })
  }

  if (nullItems) {
    groups.push({ label: 'Empty label', items: sortItems(nullItems) })
  }

  return { groups, boughtItems: bought }
}

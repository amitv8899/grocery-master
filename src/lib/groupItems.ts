import type { Item } from './types'

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

  // "Empty label" group first
  if (groupMap.has(null)) {
    groups.push({ label: 'Empty label', items: sortItems(groupMap.get(null)!) })
    groupMap.delete(null)
  }

  // Remaining labels ordered by their first item's created_at
  const labelEntries = Array.from(groupMap.entries()).sort(([, aItems], [, bItems]) => {
    const aFirst = Math.min(...aItems.map((i) => new Date(i.created_at).getTime()))
    const bFirst = Math.min(...bItems.map((i) => new Date(i.created_at).getTime()))
    return aFirst - bFirst
  })

  for (const [label, labelItems] of labelEntries) {
    groups.push({ label: label!, items: sortItems(labelItems) })
  }

  return { groups, boughtItems: bought }
}

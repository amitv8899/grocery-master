'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Item } from '@/lib/types'
import { fetchItems, checkItem, updateItem, clearBoughtItems } from '@/lib/itemsService'
import { groupItems } from '@/lib/groupItems'
import AddItemForm from '@/components/AddItemForm'
import LabelFilterBar from '@/components/LabelFilterBar'
import LabelGroup from '@/components/LabelGroup'

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeLabel, setActiveLabel] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchItems()
      setItems(data)
    } catch {
      setError('Failed to load.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const groups = useMemo(() => groupItems(items), [items])
  const labels = useMemo(() => groups.map((g) => g.label), [groups])

  // Reset activeLabel if it no longer exists after mutation
  useEffect(() => {
    if (activeLabel !== null && !labels.includes(activeLabel)) {
      setActiveLabel(null)
    }
  }, [labels, activeLabel])

  const visibleGroups = useMemo(
    () => (activeLabel === null ? groups : groups.filter((g) => g.label === activeLabel)),
    [groups, activeLabel]
  )

  const hasChecked = items.some((i) => i.checked && i.deleted_at === null)

  function handleAdd(item: Item) {
    setItems((prev) => [...prev, item])
  }

  async function handleCheck(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: true } : i)))
    try {
      await checkItem(id)
    } catch {
      // re-fetch on failure to sync state
      load()
    }
  }

  async function handleUpdate(id: string, data: Partial<Pick<Item, 'name' | 'count' | 'priority' | 'label'>>) {
    try {
      const updated = await updateItem(id, data)
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
    } catch {
      alert('Failed to update item.')
    }
  }

  async function handleClearBought() {
    try {
      await clearBoughtItems()
      setItems((prev) => prev.filter((i) => !i.checked))
    } catch {
      alert('Failed to clear items.')
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center flex-col gap-3">
        <p className="text-sm text-gray-500">Failed to load. Tap to retry.</p>
        <button
          onClick={load}
          className="h-10 px-6 bg-gray-900 text-white rounded-md text-sm font-medium"
        >
          Retry
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Grocery Master</h1>

      <div className="mb-4">
        <AddItemForm onAdd={handleAdd} />
      </div>

      {labels.length > 0 && (
        <div className="mb-4">
          <LabelFilterBar labels={labels} activeLabel={activeLabel} onChange={setActiveLabel} />
        </div>
      )}

      {visibleGroups.length === 0 && activeLabel !== null ? (
        <p className="text-sm text-gray-500 text-center py-8">No items in this category.</p>
      ) : visibleGroups.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No items yet. Add something above.</p>
      ) : (
        visibleGroups.map((group) => (
          <LabelGroup
            key={group.label}
            label={group.label}
            items={group.items}
            onCheck={handleCheck}
            onUpdate={handleUpdate}
          />
        ))
      )}

      <div className="mt-6">
        <button
          onClick={handleClearBought}
          disabled={!hasChecked}
          className="w-full h-12 bg-red-600 text-white rounded-md text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Clear all bought
        </button>
      </div>
    </main>
  )
}

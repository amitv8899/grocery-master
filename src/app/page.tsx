'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Item } from '@/lib/types'
import { fetchItems, checkItem, updateItem, deleteItem, clearBoughtItems } from '@/lib/itemsService'
import { groupItems } from '@/lib/groupItems'
import AddItemForm from '@/components/AddItemForm'
import LabelGroup from '@/components/LabelGroup'
import FAB from '@/components/FAB'
import BottomSheet from '@/components/BottomSheet'
import TabBar from '@/components/TabBar'

type Tab = 'list' | 'recipes'

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('list')

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
  const hasChecked = items.some((i) => i.checked && i.deleted_at === null)

  function handleAdd(item: Item) {
    setItems((prev) => [...prev, item])
    setSheetOpen(false)
  }

  async function handleCheck(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: true } : i)))
    try {
      await checkItem(id)
    } catch {
      load()
    }
  }

  async function handleUpdate(id: string, data: Partial<Pick<Item, 'name' | 'count' | 'priority' | 'label'>>) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...data } : i))
    )
    try {
      const updated = await updateItem(id, data)
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
    } catch {
      load()
    }
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    try {
      await deleteItem(id)
    } catch {
      load()
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
      <main className="flex min-h-screen items-center justify-center bg-warm-bg">
        <p className="text-sm text-warm-sub">Loading…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center flex-col gap-3 bg-warm-bg">
        <p className="text-sm text-warm-sub">Failed to load. Tap to retry.</p>
        <button
          onClick={load}
          className="h-10 px-6 bg-warm-text text-white rounded-xl text-sm font-medium"
        >
          Retry
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-warm-bg">
      {/* Header */}
      <header className="bg-warm-card border-b border-warm-border px-5 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-medium text-warm-text">Our Groceries</h1>
        {hasChecked && (
          <button
            onClick={handleClearBought}
            className="text-xs text-warm-sub hover:text-warm-text transition-colors"
          >
            Clear bought
          </button>
        )}
      </header>

      {/* List */}
      <div className="px-3 pt-2.5 pb-40">
        {activeTab === 'list' ? (
          groups.length === 0 ? (
            <p className="text-sm text-warm-sub text-center py-16">
              No items yet. Tap + to add something.
            </p>
          ) : (
            groups.map((group) => (
              <LabelGroup
                key={group.label}
                label={group.label}
                items={group.items}
                onCheck={handleCheck}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          )
        ) : (
          <p className="text-sm text-warm-sub text-center py-16">
            Recipes coming soon.
          </p>
        )}
      </div>

      {/* FAB */}
      <FAB onClick={() => setSheetOpen(true)} />

      {/* Add item sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <AddItemForm onAdd={handleAdd} />
      </BottomSheet>

      {/* Tab bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  )
}

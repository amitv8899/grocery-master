'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Item, Recipe } from '@/lib/types'
import { fetchItems, checkItem, uncheckItem, updateItem, deleteItem, clearBoughtItems } from '@/lib/itemsService'
import { fetchRecipes, deleteRecipe, addRecipeToList } from '@/lib/recipesService'
import { groupItems } from '@/lib/groupItems'
import AddItemForm from '@/components/AddItemForm'
import ItemRow from '@/components/ItemRow'
import LabelGroup from '@/components/LabelGroup'
import FAB from '@/components/FAB'
import BottomSheet from '@/components/BottomSheet'
import TabBar from '@/components/TabBar'
import RecipesList from '@/components/RecipesList'
import RecipeForm from '@/components/RecipeForm'
import LabelFilterBar from '@/components/LabelFilterBar'

type Tab = 'list' | 'recipes'

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('list')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recipesLoading, setRecipesLoading] = useState(true)
  const [recipesError, setRecipesError] = useState<string | null>(null)
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
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

  async function loadRecipes() {
    setRecipesLoading(true)
    setRecipesError(null)
    try {
      setRecipes(await fetchRecipes())
    } catch {
      setRecipesError('Failed to load recipes.')
    } finally {
      setRecipesLoading(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    load()
    loadRecipes()
  }, [])

  const { groups, boughtItems } = useMemo(() => groupItems(items), [items])
  const hasChecked = boughtItems.length > 0

  const labelNames = useMemo(
    () => groups.map((g) => g.label).filter((l) => l !== 'Empty label'),
    [groups]
  )

  const visibleGroups = useMemo(
    () => (activeLabel ? groups.filter((g) => g.label === activeLabel) : groups),
    [groups, activeLabel]
  )

  function handleAdd(item: Item) {
    setItems((prev) => [...prev, item])
    setSheetOpen(false)
  }

  function handleRecipeAdd(recipe: Recipe) {
    setRecipes((prev) => [...prev, recipe])
    setRecipeSheetOpen(false)
  }

  function handleRecipeUpdate(updated: Recipe) {
    setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
  }

  async function handleRecipeDelete(id: string) {
    setRecipes((prev) => prev.filter((r) => r.id !== id))
    try {
      await deleteRecipe(id)
    } catch {
      loadRecipes()
    }
  }

  async function handleAddToList(recipe: Recipe) {
    try {
      const upserted = await addRecipeToList(recipe, items)
      setItems((prev) => {
        const map = new Map(prev.map((i) => [i.id, i]))
        upserted.forEach((i) => map.set(i.id, i))
        return Array.from(map.values())
      })
      const n = recipe.ingredients.length
      showToast(`Added ${n} ingredient${n === 1 ? '' : 's'}`)
      setActiveTab('list')
    } catch {
      showToast('Failed to add to list.')
    }
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

  async function handleUncheck(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: false } : i)))
    try {
      await uncheckItem(id)
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

  if (loading && items.length === 0) {
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
        <div className="flex items-center gap-3">
          {hasChecked && (
            <button
              onClick={handleClearBought}
              className="text-xs text-warm-sub hover:text-warm-text transition-colors"
            >
              Clear bought
            </button>
          )}
          <button
            onClick={load}
            disabled={loading}
            aria-label="Refresh list"
            className="text-warm-sub hover:text-warm-text transition-colors disabled:opacity-40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading ? 'animate-spin' : ''}
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </div>
      </header>

      {/* List */}
      <div className="px-3 pt-2.5 pb-40">
        {activeTab === 'list' ? (
          groups.length === 0 && boughtItems.length === 0 ? (
            <p className="text-sm text-warm-sub text-center py-16">
              No items yet. Tap + to add something.
            </p>
          ) : (
            <>
              {labelNames.length > 1 && (
                <div className="mb-3">
                  <LabelFilterBar
                    labels={labelNames}
                    activeLabel={activeLabel}
                    onChange={setActiveLabel}
                  />
                </div>
              )}
              {visibleGroups.map((group) => (
                <LabelGroup
                  key={group.label}
                  label={group.label}
                  items={group.items}
                  onCheck={handleCheck}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
              {boughtItems.length > 0 && (
                <div className="mb-2 mt-1">
                  <div className="flex items-center gap-2 px-1 pt-2.5 pb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-warm-muted" />
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-warm-fade">
                      Bought
                    </span>
                  </div>
                  {boughtItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      labelColor={{ dot: '#aaa', bg: '#f0f0f0', text: '#888' }}
                      onCheck={() => {}}
                      onUncheck={() => handleUncheck(item.id)}
                      onUpdate={() => {}}
                      onDelete={() => handleDelete(item.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )
        ) : (
          <RecipesList
            recipes={recipes}
            loading={recipesLoading}
            error={recipesError}
            onUpdate={handleRecipeUpdate}
            onDelete={handleRecipeDelete}
            onAddToList={handleAddToList}
            onRetry={loadRecipes}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-[88px] left-4 right-4 z-30 bg-warm-text text-white text-sm text-center py-3 rounded-xl shadow-lg pointer-events-none">
          {toast}
        </div>
      )}

      {/* FAB */}
      <FAB onClick={() => activeTab === 'list' ? setSheetOpen(true) : setRecipeSheetOpen(true)} />

      {/* Add item sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <AddItemForm onAdd={handleAdd} />
      </BottomSheet>

      {/* Add recipe sheet */}
      <BottomSheet open={recipeSheetOpen} onClose={() => setRecipeSheetOpen(false)}>
        <RecipeForm onAdd={handleRecipeAdd} />
      </BottomSheet>

      {/* Tab bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  )
}

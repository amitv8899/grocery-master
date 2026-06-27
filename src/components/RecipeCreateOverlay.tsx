'use client'

import { useState } from 'react'
import { IconChevronLeft, IconTrash } from '@tabler/icons-react'
import type { Recipe, Ingredient, Priority } from '@/lib/types'
import { addRecipe } from '@/lib/recipesService'
import { TAGS } from '@/lib/tags'

type Props = {
  onAdd: (recipe: Recipe) => void
  onClose: () => void
}

export default function RecipeCreateOverlay({ onAdd, onClose }: Props) {
  const [name, setName] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', count: 1, priority: 'normal', label: '' },
  ])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function addRow() {
    setIngredients((prev) => [...prev, { name: '', count: 1, priority: 'normal', label: '' }])
  }

  function removeRow(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateField<K extends keyof Ingredient>(idx: number, field: K, value: Ingredient[K]) {
    setIngredients((prev) => prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing)))
  }

  async function handleSave() {
    setError('')
    if (!name.trim()) { setError('Recipe name is required'); return }
    if (ingredients.length === 0) { setError('At least one ingredient is required'); return }
    const invalid = ingredients.find((i) => !i.name.trim() || i.count < 1)
    if (invalid) { setError('Each ingredient needs a name and count ≥ 1'); return }
    setSaving(true)
    try {
      const recipe = await addRecipe({
        name: name.trim(),
        ingredients: ingredients.map((i) => ({ ...i, name: i.name.trim(), label: i.label?.trim() || null })),
      })
      onAdd(recipe)
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-warm-bg flex flex-col">
      {/* Sticky header */}
      <header className="flex items-center justify-between px-4 py-3 bg-warm-card border-b border-warm-border sticky top-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm text-warm-sub font-medium"
        >
          <IconChevronLeft size={18} />
          Cancel
        </button>
        <span className="text-sm font-semibold text-warm-text">New Recipe</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold text-accent-green disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Recipe name */}
        <div>
          <label className="text-xs font-medium text-warm-sub uppercase tracking-wide mb-1.5 block">
            Recipe name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="e.g. Pasta Bolognese"
            className="w-full h-11 px-3 bg-warm-card border border-warm-muted rounded-xl text-sm text-warm-text placeholder:text-warm-fade focus:outline-none focus:ring-2 focus:ring-accent-green"
          />
        </div>

        {/* Ingredients */}
        <div>
          <label className="text-xs font-medium text-warm-sub uppercase tracking-wide mb-2 block">
            Ingredients
          </label>
          <div className="flex flex-col gap-3">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="bg-warm-card border border-warm-muted rounded-xl p-3 flex flex-col gap-2">
                {/* Name row */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateField(idx, 'name', e.target.value)}
                    placeholder="e.g. Milk"
                    className="flex-1 h-10 px-3 bg-warm-bg border border-warm-muted rounded-lg text-sm text-warm-text placeholder:text-warm-fade focus:outline-none focus:ring-2 focus:ring-accent-green"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    disabled={ingredients.length === 1}
                    className="w-9 h-9 flex items-center justify-center text-warm-fade hover:text-red-600 disabled:opacity-30 flex-shrink-0"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
                {/* Count + Priority row */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={ing.count}
                    onChange={(e) => updateField(idx, 'count', Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-9 px-2 bg-warm-bg border border-warm-muted rounded-lg text-sm text-warm-text text-center focus:outline-none focus:ring-2 focus:ring-accent-green"
                  />
                  <select
                    value={ing.priority}
                    onChange={(e) => updateField(idx, 'priority', e.target.value as Priority)}
                    className="flex-1 h-9 px-2 bg-warm-bg border border-warm-muted rounded-lg text-sm text-warm-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                  >
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                {/* Category row */}
                <select
                  value={ing.label ?? ''}
                  onChange={(e) => updateField(idx, 'label', e.target.value || null)}
                  className="w-full h-9 px-2 bg-warm-bg border border-warm-muted rounded-lg text-sm text-warm-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                >
                  <option value="">Category (optional)</option>
                  {TAGS.map((tag) => (
                    <option key={tag.name} value={tag.name}>{tag.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-3 text-sm text-accent-green font-medium"
          >
            + Add ingredient
          </button>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  )
}

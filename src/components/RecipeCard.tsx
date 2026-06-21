'use client'

import { useState } from 'react'
import { IconTrash } from '@tabler/icons-react'
import type { Recipe, Ingredient, Priority } from '@/lib/types'
import { updateRecipe } from '@/lib/recipesService'

type Props = {
  recipe: Recipe
  onUpdate: (recipe: Recipe) => void
  onDelete: () => void
  onAddToList: () => Promise<void>
}

function ingredientPreview(ingredients: Ingredient[]): string {
  if (ingredients.length === 0) return ''
  const first2 = ingredients.slice(0, 2).map((i) => i.name)
  const extra = ingredients.length - 2
  return extra > 0 ? `${first2.join(', ')}, +${extra} more` : first2.join(', ')
}

export default function RecipeCard({ recipe, onUpdate, onDelete, onAddToList }: Props) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(recipe.name)
  const [editIngredients, setEditIngredients] = useState<Ingredient[]>(recipe.ingredients)
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingToList, setAddingToList] = useState(false)

  function handleCancel() {
    setEditName(recipe.name)
    setEditIngredients(recipe.ingredients)
    setNameError('')
    setEditing(false)
  }

  async function handleSave() {
    setNameError('')
    if (!editName.trim()) {
      setNameError('Recipe name is required')
      return
    }
    if (editIngredients.length === 0) {
      setNameError('At least one ingredient is required')
      return
    }
    const invalidIng = editIngredients.find((i) => !i.name.trim() || i.count < 1)
    if (invalidIng) {
      setNameError('Each ingredient needs a name and count ≥ 1')
      return
    }
    setSaving(true)
    try {
      const updated = await updateRecipe(recipe.id, {
        name: editName.trim(),
        ingredients: editIngredients.map((i) => ({
          ...i,
          name: i.name.trim(),
          label: i.label?.trim() || null,
        })),
      })
      onUpdate(updated)
      setEditing(false)
    } catch {
      setNameError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  function addIngredientRow() {
    setEditIngredients((prev) => [...prev, { name: '', count: 1, priority: 'normal', label: '' }])
  }

  function removeIngredientRow(idx: number) {
    setEditIngredients((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateIngredientField<K extends keyof Ingredient>(
    idx: number,
    field: K,
    value: Ingredient[K]
  ) {
    setEditIngredients((prev) => prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing)))
  }

  async function handleAddToList() {
    setAddingToList(true)
    try {
      await onAddToList()
    } finally {
      setAddingToList(false)
    }
  }

  if (editing) {
    return (
      <div className="bg-warm-card rounded-xl border border-warm-border mb-1.5 p-3 flex flex-col gap-2">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          autoFocus
          placeholder="Recipe name"
          className="w-full h-10 px-3 bg-warm-bg border border-warm-muted rounded-lg text-sm text-warm-text placeholder:text-warm-fade focus:outline-none focus:ring-2 focus:ring-accent-green"
        />

        <div className="flex flex-col gap-1.5">
          {editIngredients.map((ing, idx) => (
            <div key={idx} className="flex gap-1.5 items-center">
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredientField(idx, 'name', e.target.value)}
                placeholder="e.g. Milk"
                className="flex-1 h-9 px-2 bg-warm-bg border border-warm-muted rounded-lg text-sm text-warm-text placeholder:text-warm-fade focus:outline-none focus:ring-2 focus:ring-accent-green"
              />
              <input
                type="number"
                min="1"
                value={ing.count}
                onChange={(e) => updateIngredientField(idx, 'count', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 h-9 px-2 bg-warm-bg border border-warm-muted rounded-lg text-sm text-warm-text focus:outline-none focus:ring-2 focus:ring-accent-green"
              />
              <select
                value={ing.priority}
                onChange={(e) => updateIngredientField(idx, 'priority', e.target.value as Priority)}
                className="w-24 h-9 px-1 bg-warm-bg border border-warm-muted rounded-lg text-xs text-warm-text focus:outline-none focus:ring-2 focus:ring-accent-green"
              >
                <option value="high">#1 High</option>
                <option value="normal">#2 Normal</option>
                <option value="low">#3 Low</option>
              </select>
              <input
                type="text"
                value={ing.label ?? ''}
                onChange={(e) => updateIngredientField(idx, 'label', e.target.value)}
                placeholder="Label"
                className="w-20 h-9 px-2 bg-warm-bg border border-warm-muted rounded-lg text-xs text-warm-text placeholder:text-warm-fade focus:outline-none focus:ring-2 focus:ring-accent-green"
              />
              <button
                type="button"
                onClick={() => removeIngredientRow(idx)}
                disabled={editIngredients.length === 1}
                className="w-8 h-9 flex items-center justify-center text-warm-fade hover:text-red-600 disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addIngredientRow}
          className="text-sm text-accent-green font-medium text-left"
        >
          + Add ingredient
        </button>

        {nameError && <p className="text-xs text-red-600">{nameError}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-10 bg-warm-text text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 h-10 border border-warm-muted text-warm-sub rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-warm-card rounded-xl border border-warm-border mb-1.5 flex items-center overflow-hidden">
      <button
        onClick={() => setEditing(true)}
        className="flex-1 px-3 py-3 text-left min-w-0"
      >
        <p className="text-sm font-medium text-warm-text truncate">{recipe.name}</p>
        <p className="text-xs text-warm-sub mt-0.5 truncate">{ingredientPreview(recipe.ingredients)}</p>
      </button>

      <div className="flex items-center gap-1.5 pr-2.5 flex-shrink-0">
        <button
          onClick={handleAddToList}
          disabled={addingToList}
          className="h-8 px-3 text-xs font-medium bg-accent-green text-white rounded-lg disabled:opacity-50"
        >
          {addingToList ? '…' : 'Add to list'}
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete recipe"
          className="w-8 h-8 flex items-center justify-center text-warm-fade rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <IconTrash size={16} />
        </button>
      </div>
    </div>
  )
}

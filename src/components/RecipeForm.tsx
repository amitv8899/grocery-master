'use client'

import { useState } from 'react'
import type { Recipe, Ingredient, Priority } from '@/lib/types'
import { addRecipe } from '@/lib/recipesService'

type Props = {
  onAdd: (recipe: Recipe) => void
}

export default function RecipeForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', count: 1, priority: 'normal', label: '' },
  ])
  const [nameError, setNameError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function addIngredientRow() {
    setIngredients((prev) => [...prev, { name: '', count: 1, priority: 'normal', label: '' }])
  }

  function removeIngredientRow(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateIngredientField<K extends keyof Ingredient>(
    idx: number,
    field: K,
    value: Ingredient[K]
  ) {
    setIngredients((prev) => prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameError('')

    if (!name.trim()) {
      setNameError('Recipe name is required')
      return
    }
    if (ingredients.length === 0) {
      setNameError('At least one ingredient is required')
      return
    }
    const invalidIng = ingredients.find((i) => !i.name.trim() || i.count < 1)
    if (invalidIng) {
      setNameError('Each ingredient needs a name and count ≥ 1')
      return
    }

    setSubmitting(true)
    try {
      const recipe = await addRecipe({
        name: name.trim(),
        ingredients: ingredients.map((i) => ({
          ...i,
          name: i.name.trim(),
          label: i.label?.trim() || null,
        })),
      })
      onAdd(recipe)
      setName('')
      setIngredients([{ name: '', count: 1, priority: 'normal', label: '' }])
    } catch {
      setNameError('Failed to save. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="text-base font-medium text-warm-text mb-4">New recipe</p>

      <p className="text-[10px] font-semibold tracking-[0.8px] uppercase text-warm-sub mb-1.5">Name</p>
      <div className="mb-3.5">
        <input
          type="text"
          placeholder="e.g. Pasta Night"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-warm-bg border border-warm-muted rounded-xl px-3 py-[11px] text-sm text-warm-text placeholder:text-warm-fade focus:outline-none focus:ring-2 focus:ring-accent-green"
        />
      </div>

      <p className="text-[10px] font-semibold tracking-[0.8px] uppercase text-warm-sub mb-1.5">Ingredients</p>
      <div className="flex flex-col gap-1.5 mb-2">
        {ingredients.map((ing, idx) => (
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
              disabled={ingredients.length === 1}
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
        className="text-sm text-accent-green font-medium mb-3"
      >
        + Add ingredient
      </button>

      {nameError && <p className="mt-1 mb-3 text-xs text-red-600">{nameError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-[14px] rounded-xl bg-warm-text text-white text-[15px] font-medium disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Save recipe'}
      </button>
    </form>
  )
}

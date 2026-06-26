'use client'

import { useState } from 'react'
import { IconTrash } from '@tabler/icons-react'
import type { Recipe, Ingredient } from '@/lib/types'

type Props = {
  recipe: Recipe
  onEdit: () => void
  onDelete: () => void
  onAddToList: () => Promise<void>
}

function ingredientPreview(ingredients: Ingredient[]): string {
  if (ingredients.length === 0) return ''
  const first2 = ingredients.slice(0, 2).map((i) => i.name)
  const extra = ingredients.length - 2
  return extra > 0 ? `${first2.join(', ')}, +${extra} more` : first2.join(', ')
}

export default function RecipeCard({ recipe, onEdit, onDelete, onAddToList }: Props) {
  const [addingToList, setAddingToList] = useState(false)

  async function handleAddToList() {
    setAddingToList(true)
    try {
      await onAddToList()
    } finally {
      setAddingToList(false)
    }
  }

  return (
    <div className="bg-warm-card rounded-xl border border-warm-border mb-1.5 flex items-center overflow-hidden">
      <button
        onClick={onEdit}
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

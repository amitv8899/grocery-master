'use client'

import type { Recipe } from '@/lib/types'
import RecipeCard from './RecipeCard'

type Props = {
  recipes: Recipe[]
  loading: boolean
  error: string | null
  onEdit: (recipe: Recipe) => void
  onDelete: (id: string) => void
  onAddToList: (recipe: Recipe) => Promise<void>
  onRetry: () => void
}

export default function RecipesList({
  recipes,
  loading,
  error,
  onEdit,
  onDelete,
  onAddToList,
  onRetry,
}: Props) {
  if (loading) {
    return <p className="text-sm text-warm-sub text-center py-16">Loading…</p>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-sm text-warm-sub">{error}</p>
        <button
          onClick={onRetry}
          className="h-10 px-6 bg-warm-text text-white rounded-xl text-sm font-medium"
        >
          Retry
        </button>
      </div>
    )
  }

  if (recipes.length === 0) {
    return (
      <p className="text-sm text-warm-sub text-center py-16">
        No recipes yet. Tap + to add one.
      </p>
    )
  }

  return (
    <div>
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onEdit={() => onEdit(recipe)}
          onDelete={() => onDelete(recipe.id)}
          onAddToList={() => onAddToList(recipe)}
        />
      ))}
    </div>
  )
}

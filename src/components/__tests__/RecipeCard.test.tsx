import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RecipeCard from '../RecipeCard'

const mockRecipe = {
  id: 'r1',
  name: 'Pasta Night',
  ingredients: [
    { name: 'Pasta', count: 2, priority: 'normal' as const, label: null },
    { name: 'Eggs', count: 6, priority: 'normal' as const, label: null },
    { name: 'Milk', count: 1, priority: 'low' as const, label: null },
    { name: 'Butter', count: 1, priority: 'low' as const, label: null },
  ],
  deleted_at: null,
  created_at: '2024-01-01T00:00:00Z',
}

function renderCard(overrides?: Partial<typeof mockRecipe>) {
  const recipe = { ...mockRecipe, ...overrides }
  const onEdit = jest.fn()
  const onDelete = jest.fn()
  const onAddToList = jest.fn().mockResolvedValue(undefined)
  render(
    <RecipeCard
      recipe={recipe}
      onEdit={onEdit}
      onDelete={onDelete}
      onAddToList={onAddToList}
    />
  )
  return { onEdit, onDelete, onAddToList }
}

describe('RecipeCard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders recipe name', () => {
    renderCard()
    expect(screen.getByText('Pasta Night')).toBeInTheDocument()
  })

  it('shows first 2 ingredient names when ≤2 ingredients', () => {
    renderCard({ ingredients: [
      { name: 'Milk', count: 1, priority: 'normal', label: null },
      { name: 'Eggs', count: 6, priority: 'normal', label: null },
    ]})
    expect(screen.getByText('Milk, Eggs')).toBeInTheDocument()
  })

  it('shows +N more when >2 ingredients', () => {
    renderCard()
    expect(screen.getByText('Pasta, Eggs, +2 more')).toBeInTheDocument()
  })

  it('clicking card body calls onEdit', () => {
    const { onEdit } = renderCard()
    fireEvent.click(screen.getByText('Pasta Night'))
    expect(onEdit).toHaveBeenCalled()
  })

  it('clicking trash calls onDelete', () => {
    const { onDelete } = renderCard()
    fireEvent.click(screen.getByLabelText('Delete recipe'))
    expect(onDelete).toHaveBeenCalled()
  })

  it('clicking Add to list calls onAddToList', async () => {
    const { onAddToList } = renderCard()
    fireEvent.click(screen.getByRole('button', { name: /add to list/i }))
    await waitFor(() => expect(onAddToList).toHaveBeenCalled())
  })
})

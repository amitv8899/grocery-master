import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RecipeCard from '../RecipeCard'

jest.mock('@/lib/recipesService', () => ({
  updateRecipe: jest.fn(),
}))

import { updateRecipe } from '@/lib/recipesService'
const mockUpdateRecipe = updateRecipe as jest.Mock

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
  const onUpdate = jest.fn()
  const onDelete = jest.fn()
  const onAddToList = jest.fn().mockResolvedValue(undefined)
  render(
    <RecipeCard
      recipe={recipe}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onAddToList={onAddToList}
    />
  )
  return { onUpdate, onDelete, onAddToList }
}

describe('RecipeCard — view mode', () => {
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

  it('clicking card body enters edit mode', () => {
    renderCard()
    fireEvent.click(screen.getByText('Pasta Night'))
    expect(screen.getByPlaceholderText('Recipe name')).toBeInTheDocument()
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

describe('RecipeCard — edit mode', () => {
  beforeEach(() => jest.clearAllMocks())

  function enterEditMode(overrides?: Partial<typeof mockRecipe>) {
    const handlers = renderCard(overrides)
    fireEvent.click(screen.getByText(overrides?.name ?? 'Pasta Night'))
    return handlers
  }

  it('Cancel exits edit mode and restores original name', () => {
    enterEditMode()
    const nameInput = screen.getByPlaceholderText('Recipe name')
    fireEvent.change(nameInput, { target: { value: 'Changed' } })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByText('Pasta Night')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Recipe name')).not.toBeInTheDocument()
  })

  it('shows error and does not call updateRecipe when name is empty', async () => {
    enterEditMode()
    const nameInput = screen.getByPlaceholderText('Recipe name')
    fireEvent.change(nameInput, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
    expect(mockUpdateRecipe).not.toHaveBeenCalled()
  })

  it('shows error when ingredient name is empty', async () => {
    enterEditMode()
    const ingInputs = screen.getAllByPlaceholderText('e.g. Milk')
    fireEvent.change(ingInputs[0], { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(await screen.findByText(/name and count/i)).toBeInTheDocument()
    expect(mockUpdateRecipe).not.toHaveBeenCalled()
  })

  it('calls updateRecipe and onUpdate on valid save', async () => {
    const updated = { ...mockRecipe, name: 'Updated Name' }
    mockUpdateRecipe.mockResolvedValue(updated)
    const { onUpdate } = enterEditMode()

    const nameInput = screen.getByPlaceholderText('Recipe name')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(mockUpdateRecipe).toHaveBeenCalledWith('r1', expect.objectContaining({ name: 'Updated Name' })))
    expect(onUpdate).toHaveBeenCalledWith(updated)
  })

  it('shows error and stays in edit mode when updateRecipe throws', async () => {
    mockUpdateRecipe.mockRejectedValue(new Error('fail'))
    enterEditMode()
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(await screen.findByText(/failed to save/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Recipe name')).toBeInTheDocument()
  })

  it('remove ingredient button is disabled at 1 row', () => {
    renderCard({ ingredients: [{ name: 'Pasta', count: 2, priority: 'normal', label: null }] })
    fireEvent.click(screen.getByText('Pasta'))
    expect(screen.getByRole('button', { name: '×' })).toBeDisabled()
  })

  it('adds ingredient row in edit mode', () => {
    enterEditMode()
    const before = screen.getAllByPlaceholderText('e.g. Milk').length
    fireEvent.click(screen.getByRole('button', { name: /\+ add ingredient/i }))
    expect(screen.getAllByPlaceholderText('e.g. Milk')).toHaveLength(before + 1)
  })
})

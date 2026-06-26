import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import RecipesList from '../RecipesList'

jest.mock('../RecipeCard', () => ({
  __esModule: true,
  default: () => <div data-testid="recipe-card" />,
}))

const noop = async () => {}

const baseProps = {
  recipes: [],
  loading: false,
  error: null,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onAddToList: noop,
  onRetry: jest.fn(),
}

const mockRecipe = {
  id: 'r1',
  name: 'Pasta Night',
  ingredients: [],
  deleted_at: null,
  created_at: '2024-01-01T00:00:00Z',
}

describe('RecipesList', () => {
  it('shows Loading… when loading=true', () => {
    render(<RecipesList {...baseProps} loading={true} />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows error message when error is set', () => {
    render(<RecipesList {...baseProps} error="Failed to load recipes." />)
    expect(screen.getByText('Failed to load recipes.')).toBeInTheDocument()
  })

  it('shows Retry button on error', () => {
    render(<RecipesList {...baseProps} error="Failed to load recipes." />)
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('Retry button calls onRetry', () => {
    const onRetry = jest.fn()
    render(<RecipesList {...baseProps} error="err" onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('shows empty state when recipes=[] and not loading', () => {
    render(<RecipesList {...baseProps} />)
    expect(screen.getByText('No recipes yet. Tap + to add one.')).toBeInTheDocument()
  })

  it('renders one RecipeCard per recipe', () => {
    render(<RecipesList {...baseProps} recipes={[mockRecipe, { ...mockRecipe, id: 'r2' }]} />)
    expect(screen.getAllByTestId('recipe-card')).toHaveLength(2)
  })
})

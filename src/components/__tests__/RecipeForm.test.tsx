import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecipeForm from '../RecipeForm'

jest.mock('@/lib/recipesService', () => ({
  addRecipe: jest.fn(),
}))

import { addRecipe } from '@/lib/recipesService'
const mockAddRecipe = addRecipe as jest.Mock

const mockRecipe = {
  id: 'r1',
  name: 'Pasta Night',
  ingredients: [{ name: 'Pasta', count: 2, priority: 'normal' as const, label: null }],
  deleted_at: null,
  created_at: '2024-01-01T00:00:00Z',
}

function renderForm(onAdd = jest.fn()) {
  return { onAdd, ...render(<RecipeForm onAdd={onAdd} />) }
}

describe('RecipeForm', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows error and does not call addRecipe when name is empty', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /save recipe/i }))
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
    expect(mockAddRecipe).not.toHaveBeenCalled()
  })

  it('shows error when ingredient name is empty', async () => {
    renderForm()
    await userEvent.type(screen.getByPlaceholderText(/pasta night/i), 'My Recipe')
    fireEvent.click(screen.getByRole('button', { name: /save recipe/i }))
    expect(await screen.findByText(/name and count/i)).toBeInTheDocument()
    expect(mockAddRecipe).not.toHaveBeenCalled()
  })

  it('calls addRecipe and onAdd with valid data', async () => {
    const onAdd = jest.fn()
    mockAddRecipe.mockResolvedValue(mockRecipe)
    render(<RecipeForm onAdd={onAdd} />)

    await userEvent.type(screen.getByPlaceholderText(/pasta night/i), 'Pasta Night')
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. milk/i), 'Pasta')
    fireEvent.click(screen.getByRole('button', { name: /save recipe/i }))

    await waitFor(() => expect(mockAddRecipe).toHaveBeenCalled())
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith(mockRecipe))
  })

  it('resets form after successful submit', async () => {
    mockAddRecipe.mockResolvedValue(mockRecipe)
    renderForm()

    await userEvent.type(screen.getByPlaceholderText(/pasta night/i), 'Pasta Night')
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. milk/i), 'Pasta')
    fireEvent.click(screen.getByRole('button', { name: /save recipe/i }))

    await waitFor(() => expect(mockAddRecipe).toHaveBeenCalled())
    expect(screen.getByPlaceholderText(/pasta night/i)).toHaveValue('')
  })

  it('adds ingredient row when clicking + Add ingredient', () => {
    renderForm()
    const before = screen.getAllByPlaceholderText(/e\.g\. milk/i).length
    fireEvent.click(screen.getByRole('button', { name: /\+ add ingredient/i }))
    expect(screen.getAllByPlaceholderText(/e\.g\. milk/i)).toHaveLength(before + 1)
  })

  it('removes ingredient row when clicking ×', () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /\+ add ingredient/i }))
    const removeButtons = screen.getAllByRole('button', { name: '×' })
    fireEvent.click(removeButtons[0])
    expect(screen.getAllByPlaceholderText(/e\.g\. milk/i)).toHaveLength(1)
  })

  it('remove button is disabled when only 1 ingredient row', () => {
    renderForm()
    const removeBtn = screen.getByRole('button', { name: '×' })
    expect(removeBtn).toBeDisabled()
  })

  it('shows error message when addRecipe throws', async () => {
    mockAddRecipe.mockRejectedValue(new Error('fail'))
    renderForm()

    await userEvent.type(screen.getByPlaceholderText(/pasta night/i), 'Pasta Night')
    await userEvent.type(screen.getByPlaceholderText(/e\.g\. milk/i), 'Pasta')
    fireEvent.click(screen.getByRole('button', { name: /save recipe/i }))

    expect(await screen.findByText(/failed to save/i)).toBeInTheDocument()
  })
})

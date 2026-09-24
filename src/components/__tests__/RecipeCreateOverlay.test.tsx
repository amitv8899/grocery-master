import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RecipeCreateOverlay from '../RecipeCreateOverlay'
import * as recipesService from '@/lib/recipesService'
import type { Recipe } from '@/lib/types'

jest.mock('@/lib/recipesService')

const mockAddRecipe = recipesService.addRecipe as jest.Mock

const fakeRecipe: Recipe = {
  id: 'r1',
  name: 'Pasta Night',
  ingredients: [{ name: 'Flour', count: 500, unit: 'g', priority: 'normal', label: null }],
  deleted_at: null,
  created_at: new Date().toISOString(),
}

describe('RecipeCreateOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('defaults each ingredient to the "count" unit', () => {
    render(<RecipeCreateOverlay onAdd={jest.fn()} onClose={jest.fn()} />)
    expect(screen.getByLabelText('Unit')).toHaveValue('count')
  })

  it('picking a non-count unit resets the quantity to that unit\'s step', () => {
    render(<RecipeCreateOverlay onAdd={jest.fn()} onClose={jest.fn()} />)

    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'g' } })

    expect(screen.getByLabelText('Unit')).toHaveValue('g')
    expect(screen.getByDisplayValue('50')).toBeInTheDocument()
  })

  it('saves ingredients with their selected unit', async () => {
    mockAddRecipe.mockResolvedValue(fakeRecipe)
    const onAdd = jest.fn()
    render(<RecipeCreateOverlay onAdd={onAdd} onClose={jest.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('e.g. Pasta Bolognese'), { target: { value: 'Pasta Night' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. Milk'), { target: { value: 'Flour' } })
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'g' } })
    fireEvent.change(screen.getByDisplayValue('50'), { target: { value: '500' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(mockAddRecipe).toHaveBeenCalled())
    expect(mockAddRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredients: [expect.objectContaining({ name: 'Flour', count: 500, unit: 'g' })],
      })
    )
    expect(onAdd).toHaveBeenCalledWith(fakeRecipe)
  })
})

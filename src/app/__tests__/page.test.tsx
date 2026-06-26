import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import Home from '../page'
import * as itemsService from '@/lib/itemsService'
import * as recipesService from '@/lib/recipesService'
import * as catalogService from '@/lib/catalogService'
import type { Item } from '@/lib/types'

jest.mock('@/lib/itemsService')
jest.mock('@/lib/recipesService')
jest.mock('@/lib/catalogService')

const mockFetchItems = itemsService.fetchItems as jest.Mock
const mockFetchRecipes = recipesService.fetchRecipes as jest.Mock
const mockLookupCatalog = catalogService.lookupCatalog as jest.Mock

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: Math.random().toString(),
    name: 'item',
    count: 1,
    priority: 'normal',
    checked: false,
    label: 'Produce',
    deleted_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFetchRecipes.mockResolvedValue([])
  mockLookupCatalog.mockResolvedValue(null)
})

describe('page.tsx', () => {
  it('renders empty state when no items', async () => {
    mockFetchItems.mockResolvedValue([])

    await act(async () => {
      render(<Home />)
    })

    expect(screen.getByText(/no items yet/i)).toBeInTheDocument()
  })

  it('renders items after load', async () => {
    mockFetchItems.mockResolvedValue([makeItem({ name: 'Apples' })])

    await act(async () => {
      render(<Home />)
    })

    expect(screen.getByText('Apples')).toBeInTheDocument()
  })

  it('shows error state on fetch failure', async () => {
    mockFetchItems.mockRejectedValue(new Error('network error'))

    await act(async () => {
      render(<Home />)
    })

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    })
  })

  it('label filter bar appears when 2+ distinct labels present', async () => {
    mockFetchItems.mockResolvedValue([
      makeItem({ label: 'Produce' }),
      makeItem({ label: 'Dairy' }),
    ])

    await act(async () => {
      render(<Home />)
    })

    expect(screen.getAllByText('Produce').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Dairy').length).toBeGreaterThan(0)
  })
})

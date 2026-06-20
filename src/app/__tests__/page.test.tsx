import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import Home from '../page'
import * as itemsService from '@/lib/itemsService'
import type { Item } from '@/lib/types'

jest.mock('@/lib/itemsService')

const mockFetchItems = itemsService.fetchItems as jest.Mock
const mockClearBoughtItems = itemsService.clearBoughtItems as jest.Mock
const mockCheckItem = itemsService.checkItem as jest.Mock

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

beforeEach(() => jest.clearAllMocks())

describe('page.tsx', () => {
  it('clear button disabled when no checked items', async () => {
    const items = [makeItem({ checked: false })]
    mockFetchItems.mockResolvedValue(items)

    await act(async () => {
      render(<Home />)
    })

    const clearBtn = screen.getByRole('button', { name: /clear all bought/i })
    expect(clearBtn).toBeDisabled()
  })

  it('activeLabel auto-resets after clearing all items in that label', async () => {
    const produceItem = makeItem({ id: 'p1', label: 'Produce', checked: false })
    const dairyItem = makeItem({ id: 'd1', label: 'Dairy', checked: false })
    mockFetchItems.mockResolvedValue([produceItem, dairyItem])
    mockCheckItem.mockResolvedValue(undefined)
    mockClearBoughtItems.mockResolvedValue(undefined)

    await act(async () => {
      render(<Home />)
    })

    // Click "Produce" filter pill
    fireEvent.click(screen.getByRole('button', { name: 'Produce' }))

    // Check the produce item off
    await act(async () => {
      fireEvent.click(screen.getAllByRole('checkbox')[0])
    })

    // Clear bought — produce item was checked, dairy was not
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /clear all bought/i }))
    })

    // "Produce" label no longer exists — activeLabel should reset, dairy visible
    await waitFor(() => {
      expect(screen.queryByText('item')).toBeInTheDocument() // dairy item still shown
    })
  })
})

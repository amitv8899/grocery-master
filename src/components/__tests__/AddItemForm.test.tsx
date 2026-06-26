'use client'

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddItemForm from '../AddItemForm'
import * as itemsService from '@/lib/itemsService'
import * as catalogService from '@/lib/catalogService'
import type { Item } from '@/lib/types'

jest.mock('@/lib/itemsService')
jest.mock('@/lib/catalogService')

const mockAddItem = itemsService.addItem as jest.Mock
const mockLookupCatalog = catalogService.lookupCatalog as jest.Mock
const mockUpsertCatalog = catalogService.upsertCatalog as jest.Mock

const fakeItem: Item = {
  id: '1',
  name: 'Milk',
  count: 2,
  priority: 'normal',
  checked: false,
  label: null,
  deleted_at: null,
  created_at: new Date().toISOString(),
}

describe('AddItemForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLookupCatalog.mockResolvedValue(null)
    mockUpsertCatalog.mockResolvedValue(undefined)
  })

  it('empty name → shows validation error; addItem NOT called', () => {
    render(<AddItemForm onAdd={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /add to list/i }))
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(mockAddItem).not.toHaveBeenCalled()
  })

  it('valid submit → calls addItem then onAdd', async () => {
    mockAddItem.mockResolvedValue(fakeItem)
    const onAdd = jest.fn()
    render(<AddItemForm onAdd={onAdd} />)

    fireEvent.change(screen.getByPlaceholderText('e.g. Chicken breast'), { target: { value: 'Milk' } })
    fireEvent.click(screen.getByRole('button', { name: /add to list/i }))

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith(fakeItem))
    expect(mockAddItem).toHaveBeenCalledWith(expect.objectContaining({ name: 'Milk' }))
  })

  it('no tag selected → addItem called with label: null', async () => {
    mockAddItem.mockResolvedValue(fakeItem)
    render(<AddItemForm onAdd={jest.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('e.g. Chicken breast'), { target: { value: 'Bread' } })
    fireEvent.click(screen.getByRole('button', { name: /add to list/i }))

    await waitFor(() => expect(mockAddItem).toHaveBeenCalled())
    expect(mockAddItem).toHaveBeenCalledWith(expect.objectContaining({ label: null }))
  })

  it('form resets after successful submit', async () => {
    mockAddItem.mockResolvedValue(fakeItem)
    render(<AddItemForm onAdd={jest.fn()} />)

    const nameInput = screen.getByPlaceholderText('e.g. Chicken breast') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Butter' } })
    fireEvent.click(screen.getByRole('button', { name: /add to list/i }))

    await waitFor(() => expect(nameInput.value).toBe(''))
  })

  it('catalog lookup pre-fills tag on name blur', async () => {
    mockLookupCatalog.mockResolvedValue('Dairy')
    mockAddItem.mockResolvedValue(fakeItem)
    render(<AddItemForm onAdd={jest.fn()} />)

    const nameInput = screen.getByPlaceholderText('e.g. Chicken breast')
    fireEvent.change(nameInput, { target: { value: 'Milk' } })
    fireEvent.blur(nameInput)

    await waitFor(() => expect(screen.getByText('Dairy')).toBeInTheDocument())
  })
})

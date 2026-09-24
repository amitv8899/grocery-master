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
const mockUpdateItem = itemsService.updateItem as jest.Mock
const mockLookupCatalog = catalogService.lookupCatalog as jest.Mock
const mockUpsertCatalog = catalogService.upsertCatalog as jest.Mock

const fakeItem: Item = {
  id: '1',
  name: 'Milk',
  count: 2,
  unit: 'count',
  priority: 'normal',
  checked: false,
  label: null,
  from_recipe: false,
  deleted_at: null,
  created_at: new Date().toISOString(),
}

const existingChocolate: Item = {
  id: '2',
  name: 'Chocolate',
  count: 1,
  unit: 'count',
  priority: 'normal',
  checked: false,
  label: null,
  from_recipe: false,
  deleted_at: null,
  created_at: new Date().toISOString(),
}

const existingChocolateMilk: Item = {
  id: '3',
  name: 'Chocolate milk',
  count: 1,
  unit: 'count',
  priority: 'normal',
  checked: true,
  label: 'Dairy',
  from_recipe: false,
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

  it('typing a partial match shows both "Chocolate" and "Chocolate milk" suggestions', () => {
    render(
      <AddItemForm items={[existingChocolate, existingChocolateMilk]} onAdd={jest.fn()} onMerge={jest.fn()} />
    )

    fireEvent.change(screen.getByPlaceholderText('e.g. Chicken breast'), { target: { value: 'choc' } })

    expect(screen.getByText('Chocolate')).toBeInTheDocument()
    expect(screen.getByText('Chocolate milk')).toBeInTheDocument()
  })

  it('selecting an existing unchecked suggestion merges quantity instead of creating a duplicate', async () => {
    mockUpdateItem.mockResolvedValue({ ...existingChocolate, count: 2 })
    const onAdd = jest.fn()
    const onMerge = jest.fn()
    render(<AddItemForm items={[existingChocolate]} onAdd={onAdd} onMerge={onMerge} />)

    fireEvent.change(screen.getByPlaceholderText('e.g. Chicken breast'), { target: { value: 'choc' } })
    fireEvent.click(screen.getByText('Chocolate'))
    fireEvent.click(screen.getByRole('button', { name: /update list/i }))

    await waitFor(() => expect(mockUpdateItem).toHaveBeenCalledWith('2', { count: 2, checked: false }))
    expect(mockAddItem).not.toHaveBeenCalled()
    expect(onMerge).toHaveBeenCalledWith({ ...existingChocolate, count: 2 })
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('selecting an already-bought suggestion brings it back to the active list', async () => {
    mockUpdateItem.mockResolvedValue({ ...existingChocolateMilk, count: 2, checked: false })
    const onMerge = jest.fn()
    render(<AddItemForm items={[existingChocolateMilk]} onAdd={jest.fn()} onMerge={onMerge} />)

    fireEvent.change(screen.getByPlaceholderText('e.g. Chicken breast'), { target: { value: 'chocolate milk' } })
    fireEvent.click(screen.getByText('Chocolate milk'))
    expect(screen.getByText(/already bought/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /update list/i }))

    await waitFor(() =>
      expect(mockUpdateItem).toHaveBeenCalledWith('3', { count: 2, checked: false })
    )
    expect(onMerge).toHaveBeenCalled()
  })

  it('editing the name away from a selected suggestion falls back to creating a new item', async () => {
    mockAddItem.mockResolvedValue(fakeItem)
    const onAdd = jest.fn()
    render(<AddItemForm items={[existingChocolate]} onAdd={onAdd} onMerge={jest.fn()} />)

    const nameInput = screen.getByPlaceholderText('e.g. Chicken breast')
    fireEvent.change(nameInput, { target: { value: 'choc' } })
    fireEvent.click(screen.getByText('Chocolate'))
    fireEvent.change(nameInput, { target: { value: 'Chocolate bar' } })
    fireEvent.click(screen.getByRole('button', { name: /add to list/i }))

    await waitFor(() => expect(mockAddItem).toHaveBeenCalled())
    expect(mockUpdateItem).not.toHaveBeenCalled()
    expect(onAdd).toHaveBeenCalledWith(fakeItem)
  })
})

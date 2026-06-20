import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddItemForm from '../AddItemForm'
import * as itemsService from '@/lib/itemsService'
import type { Item } from '@/lib/types'

jest.mock('@/lib/itemsService')

const mockAddItem = itemsService.addItem as jest.Mock

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
  beforeEach(() => jest.clearAllMocks())

  it('empty name → shows validation error; addItem NOT called', () => {
    render(<AddItemForm onAdd={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(mockAddItem).not.toHaveBeenCalled()
  })

  it('count < 1 → shows validation error; addItem NOT called', () => {
    render(<AddItemForm onAdd={jest.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Item name *'), { target: { value: 'Eggs' } })
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(screen.getByText('Count must be a positive integer')).toBeInTheDocument()
    expect(mockAddItem).not.toHaveBeenCalled()
  })

  it('valid submit → calls addItem then onAdd', async () => {
    mockAddItem.mockResolvedValue(fakeItem)
    const onAdd = jest.fn()
    render(<AddItemForm onAdd={onAdd} />)

    fireEvent.change(screen.getByPlaceholderText('Item name *'), { target: { value: 'Milk' } })
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith(fakeItem))
    expect(mockAddItem).toHaveBeenCalledWith(expect.objectContaining({ name: 'Milk', count: 2 }))
  })

  it('blank label → addItem called with label: null', async () => {
    mockAddItem.mockResolvedValue(fakeItem)
    render(<AddItemForm onAdd={jest.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Item name *'), { target: { value: 'Bread' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    await waitFor(() => expect(mockAddItem).toHaveBeenCalled())
    expect(mockAddItem).toHaveBeenCalledWith(expect.objectContaining({ label: null }))
  })

  it('form resets after successful submit', async () => {
    mockAddItem.mockResolvedValue(fakeItem)
    render(<AddItemForm onAdd={jest.fn()} />)

    const nameInput = screen.getByPlaceholderText('Item name *') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Butter' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    await waitFor(() => expect(nameInput.value).toBe(''))
  })
})

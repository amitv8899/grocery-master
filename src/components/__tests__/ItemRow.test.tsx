import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ItemRow from '../ItemRow'
import type { Item } from '@/lib/types'

const baseItem: Item = {
  id: '1',
  name: 'Apples',
  count: 3,
  priority: 'normal',
  checked: false,
  label: 'Produce',
  deleted_at: null,
  created_at: new Date().toISOString(),
}

describe('ItemRow', () => {
  it('check → calls onCheck', () => {
    const onCheck = jest.fn()
    render(<ItemRow item={baseItem} onCheck={onCheck} onUpdate={jest.fn()} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onCheck).toHaveBeenCalled()
  })

  it('edit button → switches to edit mode', () => {
    render(<ItemRow item={baseItem} onCheck={jest.fn()} onUpdate={jest.fn()} />)
    fireEvent.click(screen.getByLabelText('Edit item'))
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('cancel → returns to view mode without calling onUpdate', () => {
    const onUpdate = jest.fn()
    render(<ItemRow item={baseItem} onCheck={jest.fn()} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByLabelText('Edit item'))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Edit item')).toBeInTheDocument()
  })

  it('save → calls onUpdate with new values', () => {
    const onUpdate = jest.fn()
    render(<ItemRow item={baseItem} onCheck={jest.fn()} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByLabelText('Edit item'))

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'Oranges' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Oranges' }))
  })

  it('high priority item → name is bold', () => {
    const highItem = { ...baseItem, priority: 'high' as const }
    render(<ItemRow item={highItem} onCheck={jest.fn()} onUpdate={jest.fn()} />)
    const nameEl = screen.getByText('Apples')
    expect(nameEl).toHaveClass('font-bold')
  })
})

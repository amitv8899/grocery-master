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

const defaultProps = {
  onCheck: jest.fn(),
  onUncheck: jest.fn(),
  onUpdate: jest.fn(),
  onDelete: jest.fn(),
  onTagChange: jest.fn(),
}

describe('ItemRow', () => {
  it('check → calls onCheck', () => {
    const onCheck = jest.fn()
    render(<ItemRow item={baseItem} {...defaultProps} onCheck={onCheck} />)
    fireEvent.click(screen.getByLabelText('Mark as bought'))
    expect(onCheck).toHaveBeenCalled()
  })

  it('edit → switches to edit mode', () => {
    render(<ItemRow item={baseItem} {...defaultProps} />)
    fireEvent.click(screen.getByText('Apples'))
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('cancel → returns to view mode without calling onUpdate', () => {
    const onUpdate = jest.fn()
    render(<ItemRow item={baseItem} {...defaultProps} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByText('Apples'))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.getByText('Apples')).toBeInTheDocument()
  })

  it('save → calls onUpdate with new values', () => {
    const onUpdate = jest.fn()
    render(<ItemRow item={baseItem} {...defaultProps} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByText('Apples'))

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'Oranges' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Oranges' }))
  })

  it('delete → calls onDelete', () => {
    const onDelete = jest.fn()
    render(<ItemRow item={baseItem} {...defaultProps} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Delete item'))
    expect(onDelete).toHaveBeenCalled()
  })
})

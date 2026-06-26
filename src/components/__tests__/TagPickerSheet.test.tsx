import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import TagPickerSheet from '../TagPickerSheet'
import { TAGS } from '@/lib/tags'

const defaultProps = {
  open: true,
  currentTag: null,
  onSelect: jest.fn(),
  onClose: jest.fn(),
}

beforeEach(() => jest.clearAllMocks())

describe('TagPickerSheet', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<TagPickerSheet {...defaultProps} open={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all 8 tag buttons when open', () => {
    render(<TagPickerSheet {...defaultProps} />)
    TAGS.forEach((tag) => {
      expect(screen.getByText(tag.name)).toBeInTheDocument()
    })
  })

  it('clicking a tag calls onSelect with tag name', () => {
    const onSelect = jest.fn()
    render(<TagPickerSheet {...defaultProps} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Produce'))
    expect(onSelect).toHaveBeenCalledWith('Produce')
  })

  it('"No category" button calls onSelect(null)', () => {
    const onSelect = jest.fn()
    render(<TagPickerSheet {...defaultProps} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('No category'))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('shows checkmark on current tag', () => {
    render(<TagPickerSheet {...defaultProps} currentTag="Dairy" />)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('clicking backdrop calls onClose', () => {
    const onClose = jest.fn()
    render(<TagPickerSheet {...defaultProps} onClose={onClose} />)
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })
})

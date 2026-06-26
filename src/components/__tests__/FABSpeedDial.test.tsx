import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import FABSpeedDial from '../FABSpeedDial'

function renderDial(onManual = jest.fn(), onImportJSON = jest.fn()) {
  return { onManual, onImportJSON, ...render(<FABSpeedDial onManual={onManual} onImportJSON={onImportJSON} />) }
}

describe('FABSpeedDial', () => {
  it('shows only + button by default', () => {
    renderDial()
    expect(screen.getByRole('button', { name: /add recipe/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add manually/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /import json/i })).not.toBeInTheDocument()
  })

  it('shows both option bubbles after tapping +', () => {
    renderDial()
    fireEvent.click(screen.getByRole('button', { name: /add recipe/i }))
    expect(screen.getByRole('button', { name: /add manually/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /import json/i })).toBeInTheDocument()
  })

  it('hides bubbles after tapping + twice', () => {
    renderDial()
    const fab = screen.getByRole('button', { name: /add recipe/i })
    fireEvent.click(fab)
    fireEvent.click(screen.getByRole('button', { name: /close menu/i }))
    expect(screen.queryByRole('button', { name: /add manually/i })).not.toBeInTheDocument()
  })

  it('calls onManual and closes speed-dial', () => {
    const { onManual } = renderDial()
    fireEvent.click(screen.getByRole('button', { name: /add recipe/i }))
    fireEvent.click(screen.getByRole('button', { name: /add manually/i }))
    expect(onManual).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: /add manually/i })).not.toBeInTheDocument()
  })

  it('calls onImportJSON and closes speed-dial', () => {
    const { onImportJSON } = renderDial()
    fireEvent.click(screen.getByRole('button', { name: /add recipe/i }))
    fireEvent.click(screen.getByRole('button', { name: /import json/i }))
    expect(onImportJSON).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: /import json/i })).not.toBeInTheDocument()
  })

  it('closes speed-dial on backdrop click without firing callbacks', () => {
    const { onManual, onImportJSON } = renderDial()
    fireEvent.click(screen.getByRole('button', { name: /add recipe/i }))
    // backdrop has aria-hidden so query by attribute
    const backdrop = document.querySelector('[aria-hidden="true"]') as Element
    fireEvent.click(backdrop)
    expect(screen.queryByRole('button', { name: /add manually/i })).not.toBeInTheDocument()
    expect(onManual).not.toHaveBeenCalled()
    expect(onImportJSON).not.toHaveBeenCalled()
  })
})

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecipeImportSheet from '../RecipeImportSheet'

jest.mock('@/lib/recipesService', () => ({
  importRecipes: jest.fn(),
}))

jest.mock('@/lib/recipeImportTemplate', () => ({
  RECIPE_IMPORT_TEMPLATE: '[{"name":"Template","ingredients":[{"name":"Milk","count":1,"priority":"normal","label":null}]}]',
}))

import { importRecipes } from '@/lib/recipesService'
const mockImportRecipes = importRecipes as jest.Mock

const validJSON = JSON.stringify([
  { name: 'Pasta Night', ingredients: [{ name: 'Milk', count: 2, priority: 'normal', label: null }] },
])

const existingRecipes = [
  {
    id: 'r1',
    name: 'Existing Recipe',
    ingredients: [{ name: 'Eggs', count: 3, priority: 'normal' as const, label: null }],
    deleted_at: null,
    created_at: '2024-01-01T00:00:00Z',
  },
]

function renderSheet(props?: Partial<React.ComponentProps<typeof RecipeImportSheet>>) {
  const onImportDone = jest.fn()
  const onClose = jest.fn()
  const result = render(
    <RecipeImportSheet
      existingRecipes={existingRecipes}
      onImportDone={onImportDone}
      onClose={onClose}
      {...props}
    />
  )
  return { onImportDone, onClose, ...result }
}

function setTextarea(value: string) {
  const textarea = screen.getByPlaceholderText(/paste json/i)
  fireEvent.change(textarea, { target: { value } })
}

beforeEach(() => jest.clearAllMocks())

describe('RecipeImportSheet — Step 1 (input)', () => {
  it('Import button is disabled when textarea is empty', () => {
    renderSheet()
    expect(screen.getByRole('button', { name: /^import$/i })).toBeDisabled()
  })

  it('shows invalid JSON error and stays on step 1', () => {
    renderSheet()
    setTextarea('not json {')
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }))
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/paste json/i)).toBeInTheDocument()
  })

  it('shows validation errors for bad JSON content and stays on step 1', () => {
    renderSheet()
    setTextarea('[{"name":"","ingredients":[{"name":"Milk","count":1,"priority":"normal"}]}]')
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }))
    expect(screen.getByText(/name cannot be empty/i)).toBeInTheDocument()
  })

  it('advances to step 2 with valid JSON', async () => {
    renderSheet()
    setTextarea(validJSON)
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }))
    expect(await screen.findByText(/review/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/paste json/i)).not.toBeInTheDocument()
  })

  it('calls clipboard writeText on copy template click', async () => {
    const mockWrite = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText: mockWrite } })
    renderSheet()
    fireEvent.click(screen.getByRole('button', { name: /copy template/i }))
    await waitFor(() => expect(mockWrite).toHaveBeenCalled())
  })

  it('clears validation errors when textarea changes', () => {
    renderSheet()
    setTextarea('[{"name":"","ingredients":[{"name":"Milk","count":1,"priority":"normal"}]}]')
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }))
    expect(screen.getByText(/name cannot be empty/i)).toBeInTheDocument()
    setTextarea('x')
    expect(screen.queryByText(/name cannot be empty/i)).not.toBeInTheDocument()
  })
})

describe('RecipeImportSheet — Step 2 (preview)', () => {
  async function goToPreview(existingRecipesOverride = existingRecipes) {
    const { onImportDone, onClose } = renderSheet({ existingRecipes: existingRecipesOverride })
    setTextarea(validJSON)
    fireEvent.click(screen.getByRole('button', { name: /^import$/i }))
    await screen.findByText(/review/i)
    return { onImportDone, onClose }
  }

  it('shows recipe name and ingredient count in preview', async () => {
    await goToPreview()
    expect(screen.getByText('Pasta Night')).toBeInTheDocument()
    expect(screen.getByText(/1 item/i)).toBeInTheDocument()
  })

  it('shows merge badge when recipe name matches existing', async () => {
    const existing = [
      { id: 'r1', name: 'Pasta Night', ingredients: [], deleted_at: null, created_at: '2024-01-01T00:00:00Z' },
    ]
    await goToPreview(existing)
    expect(screen.getByText(/will merge with existing/i)).toBeInTheDocument()
  })

  it('back button returns to step 1', async () => {
    await goToPreview()
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByPlaceholderText(/paste json/i)).toBeInTheDocument()
  })

  it('calls importRecipes and onImportDone on confirm', async () => {
    const importResult = {
      imported: [{ id: 'r2', name: 'Pasta Night', ingredients: [], deleted_at: null, created_at: '2024-01-01T00:00:00Z' }],
      merged: [],
      failed: [],
    }
    mockImportRecipes.mockResolvedValue(importResult)
    const { onImportDone } = await goToPreview()
    fireEvent.click(screen.getByRole('button', { name: /confirm import/i }))
    await waitFor(() => expect(onImportDone).toHaveBeenCalledWith(importResult))
  })

  it('shows error inline when importRecipes throws', async () => {
    mockImportRecipes.mockRejectedValue(new Error('Server error'))
    await goToPreview()
    fireEvent.click(screen.getByRole('button', { name: /confirm import/i }))
    expect(await screen.findByText(/server error/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm import/i })).not.toBeDisabled()
  })
})

import { fetchRecipes, addRecipe, updateRecipe, deleteRecipe, addRecipeToList } from '../recipesService'

function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, jest.Mock> = {}
  const methods = ['from', 'select', 'insert', 'update', 'is', 'eq', 'order', 'single']
  methods.forEach((m) => {
    chain[m] = jest.fn(() => chain)
  })
  chain['single'] = jest.fn(() => Promise.resolve(result))
  chain['order'] = jest.fn(() => Promise.resolve(result))
  chain['is'] = jest.fn(() => chain)
  chain['eq'] = jest.fn(() => chain)
  return chain
}

jest.mock('../supabaseClient', () => ({
  supabase: { from: jest.fn() },
}))

jest.mock('../itemsService', () => ({
  addItem: jest.fn(),
  updateItem: jest.fn(),
}))

import { supabase } from '../supabaseClient'
import { addItem, updateItem } from '../itemsService'

const mockFrom = supabase.from as jest.Mock
const mockAddItem = addItem as jest.Mock
const mockUpdateItem = updateItem as jest.Mock

function setupChain(result: { data?: unknown; error?: unknown }) {
  const chain = makeChain(result)
  mockFrom.mockReturnValue(chain)
  return chain
}

beforeEach(() => {
  jest.clearAllMocks()
})

const mockRecipe = {
  id: 'r1',
  name: 'Pasta Night',
  ingredients: [
    { name: 'Pasta', count: 2, priority: 'normal' as const, label: null },
    { name: 'Sauce', count: 1, priority: 'high' as const, label: 'Pantry' },
  ],
  deleted_at: null,
  created_at: '2024-01-01T00:00:00Z',
}

describe('fetchRecipes', () => {
  it('calls .is("deleted_at", null)', async () => {
    const chain = setupChain({ data: [], error: null })
    await fetchRecipes().catch(() => {})
    expect(chain.is).toHaveBeenCalledWith('deleted_at', null)
  })

  it('calls .order("created_at", { ascending: true })', async () => {
    const chain = setupChain({ data: [], error: null })
    await fetchRecipes().catch(() => {})
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true })
  })

  it('throws on Supabase error', async () => {
    const chain = setupChain({ data: null, error: null })
    chain.order = jest.fn(() => Promise.resolve({ data: null, error: new Error('db error') }))
    mockFrom.mockReturnValue(chain)
    await expect(fetchRecipes()).rejects.toBeTruthy()
  })
})

describe('addRecipe', () => {
  it('passes name and ingredients to insert', async () => {
    const chain = setupChain({ data: mockRecipe, error: null })
    chain.single = jest.fn(() => Promise.resolve({ data: mockRecipe, error: null }))
    chain.select = jest.fn(() => chain)
    chain.insert = jest.fn(() => chain)
    mockFrom.mockReturnValue(chain)

    const payload = { name: 'Pasta Night', ingredients: mockRecipe.ingredients }
    await addRecipe(payload).catch(() => {})
    expect(chain.insert).toHaveBeenCalledWith(payload)
  })

  it('returns inserted recipe', async () => {
    const chain = setupChain({ data: mockRecipe, error: null })
    chain.single = jest.fn(() => Promise.resolve({ data: mockRecipe, error: null }))
    chain.select = jest.fn(() => chain)
    chain.insert = jest.fn(() => chain)
    mockFrom.mockReturnValue(chain)

    const result = await addRecipe({ name: 'Pasta Night', ingredients: mockRecipe.ingredients })
    expect(result).toEqual(mockRecipe)
  })

  it('throws on Supabase error', async () => {
    const chain = setupChain({ data: null, error: null })
    chain.single = jest.fn(() => Promise.resolve({ data: null, error: new Error('fail') }))
    chain.select = jest.fn(() => chain)
    chain.insert = jest.fn(() => chain)
    mockFrom.mockReturnValue(chain)
    await expect(addRecipe({ name: 'x', ingredients: [] })).rejects.toBeTruthy()
  })
})

describe('updateRecipe', () => {
  it('calls .update(data).eq("id", id)', async () => {
    const chain = setupChain({ data: mockRecipe, error: null })
    chain.single = jest.fn(() => Promise.resolve({ data: mockRecipe, error: null }))
    chain.select = jest.fn(() => chain)
    chain.update = jest.fn(() => chain)
    chain.eq = jest.fn(() => chain)
    mockFrom.mockReturnValue(chain)

    await updateRecipe('r1', { name: 'Updated' }).catch(() => {})
    expect(chain.update).toHaveBeenCalledWith({ name: 'Updated' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'r1')
  })

  it('returns updated recipe', async () => {
    const updated = { ...mockRecipe, name: 'Updated' }
    const chain = setupChain({ data: updated, error: null })
    chain.single = jest.fn(() => Promise.resolve({ data: updated, error: null }))
    chain.select = jest.fn(() => chain)
    chain.update = jest.fn(() => chain)
    chain.eq = jest.fn(() => chain)
    mockFrom.mockReturnValue(chain)

    const result = await updateRecipe('r1', { name: 'Updated' })
    expect(result.name).toBe('Updated')
  })

  it('throws on Supabase error', async () => {
    const chain = setupChain({ data: null, error: null })
    chain.single = jest.fn(() => Promise.resolve({ data: null, error: new Error('fail') }))
    chain.select = jest.fn(() => chain)
    chain.update = jest.fn(() => chain)
    chain.eq = jest.fn(() => chain)
    mockFrom.mockReturnValue(chain)
    await expect(updateRecipe('r1', { name: 'x' })).rejects.toBeTruthy()
  })
})

describe('deleteRecipe', () => {
  it('soft-deletes with deleted_at', async () => {
    const chain = setupChain({ data: null, error: null })
    chain.update = jest.fn(() => chain)
    chain.eq = jest.fn(() => Promise.resolve({ data: null, error: null }))
    mockFrom.mockReturnValue(chain)

    await deleteRecipe('r1')
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) })
    )
    expect(chain.eq).toHaveBeenCalledWith('id', 'r1')
  })

  it('does not throw on success', async () => {
    const chain = setupChain({ data: null, error: null })
    chain.update = jest.fn(() => chain)
    chain.eq = jest.fn(() => Promise.resolve({ data: null, error: null }))
    mockFrom.mockReturnValue(chain)
    await expect(deleteRecipe('r1')).resolves.toBeUndefined()
  })

  it('throws on Supabase error', async () => {
    const chain = setupChain({ data: null, error: null })
    chain.update = jest.fn(() => chain)
    chain.eq = jest.fn(() => Promise.resolve({ data: null, error: new Error('fail') }))
    mockFrom.mockReturnValue(chain)
    await expect(deleteRecipe('r1')).rejects.toBeTruthy()
  })
})

describe('addRecipeToList', () => {
  const baseItem = {
    id: 'i1',
    name: 'Pasta',
    count: 1,
    priority: 'normal' as const,
    label: null,
    checked: false,
    deleted_at: null,
    created_at: '2024-01-01T00:00:00Z',
  }

  it('calls updateItem when ingredient matches existing item (not checked)', async () => {
    const updatedItem = { ...baseItem, count: 2 }
    mockUpdateItem.mockResolvedValue(updatedItem)

    const recipe = { ...mockRecipe, ingredients: [{ name: 'Pasta', count: 2, priority: 'normal' as const, label: null }] }
    await addRecipeToList(recipe, [baseItem])

    expect(mockUpdateItem).toHaveBeenCalledWith('i1', { count: 2, checked: false })
    expect(mockAddItem).not.toHaveBeenCalled()
  })

  it('calls updateItem when ingredient matches existing item (already checked)', async () => {
    const checkedItem = { ...baseItem, checked: true }
    const updatedItem = { ...checkedItem, count: 2, checked: false }
    mockUpdateItem.mockResolvedValue(updatedItem)

    const recipe = { ...mockRecipe, ingredients: [{ name: 'Pasta', count: 2, priority: 'normal' as const, label: null }] }
    await addRecipeToList(recipe, [checkedItem])

    expect(mockUpdateItem).toHaveBeenCalledWith('i1', { count: 2, checked: false })
  })

  it('calls addItem when ingredient matches soft-deleted item', async () => {
    const deletedItem = { ...baseItem, deleted_at: '2024-01-02T00:00:00Z' }
    const newItem = { ...baseItem, id: 'i2' }
    mockAddItem.mockResolvedValue(newItem)

    const recipe = { ...mockRecipe, ingredients: [{ name: 'Pasta', count: 2, priority: 'normal' as const, label: null }] }
    await addRecipeToList(recipe, [deletedItem])

    expect(mockAddItem).toHaveBeenCalled()
    expect(mockUpdateItem).not.toHaveBeenCalled()
  })

  it('calls addItem when no match exists', async () => {
    const newItem = { ...baseItem, id: 'i2', name: 'Sauce' }
    mockAddItem.mockResolvedValue(newItem)

    const recipe = { ...mockRecipe, ingredients: [{ name: 'Sauce', count: 1, priority: 'high' as const, label: 'Pantry' }] }
    await addRecipeToList(recipe, [])

    expect(mockAddItem).toHaveBeenCalledWith({ name: 'Sauce', count: 1, priority: 'high', label: 'Pantry' })
  })

  it('match is case-insensitive and trims whitespace', async () => {
    const updatedItem = { ...baseItem, count: 2 }
    mockUpdateItem.mockResolvedValue(updatedItem)

    const recipe = { ...mockRecipe, ingredients: [{ name: ' PASTA ', count: 2, priority: 'normal' as const, label: null }] }
    await addRecipeToList(recipe, [baseItem])

    expect(mockUpdateItem).toHaveBeenCalledWith('i1', { count: 2, checked: false })
    expect(mockAddItem).not.toHaveBeenCalled()
  })

  it('returns Item[] in ingredient order', async () => {
    const item1 = { ...baseItem, id: 'i1', name: 'Pasta' }
    const item2 = { ...baseItem, id: 'i2', name: 'Sauce' }
    mockUpdateItem.mockResolvedValue(item1)
    mockAddItem.mockResolvedValue(item2)

    const recipe = {
      ...mockRecipe,
      ingredients: [
        { name: 'Pasta', count: 2, priority: 'normal' as const, label: null },
        { name: 'Sauce', count: 1, priority: 'high' as const, label: null },
      ],
    }
    const result = await addRecipeToList(recipe, [item1])
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('i1')
    expect(result[1].id).toBe('i2')
  })

  it('throws and stops on first error', async () => {
    mockUpdateItem.mockRejectedValue(new Error('network error'))

    const recipe = {
      ...mockRecipe,
      ingredients: [
        { name: 'Pasta', count: 2, priority: 'normal' as const, label: null },
        { name: 'Sauce', count: 1, priority: 'high' as const, label: null },
      ],
    }
    await expect(addRecipeToList(recipe, [baseItem])).rejects.toBeTruthy()
    expect(mockAddItem).not.toHaveBeenCalled()
  })
})

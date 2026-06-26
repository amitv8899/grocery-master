import { importRecipes } from '../recipesService'

jest.mock('../supabaseClient', () => ({
  supabase: { from: jest.fn() },
}))

jest.mock('../itemsService', () => ({
  addItem: jest.fn(),
  updateItem: jest.fn(),
}))

import { supabase } from '../supabaseClient'
const mockFrom = supabase.from as jest.Mock

function makeChain(data: unknown, error: unknown = null) {
  const chain: Record<string, jest.Mock> = {}
  const methods = ['from', 'select', 'insert', 'update', 'is', 'eq', 'order', 'single']
  methods.forEach((m) => { chain[m] = jest.fn(() => chain) })
  chain['single'] = jest.fn(() => Promise.resolve({ data, error }))
  chain['select'] = jest.fn(() => chain)
  chain['insert'] = jest.fn(() => chain)
  chain['update'] = jest.fn(() => chain)
  chain['eq'] = jest.fn(() => chain)
  mockFrom.mockReturnValue(chain)
  return chain
}

function makeRecipe(id: string, name: string, ingredients = [{ name: 'Milk', count: 2, priority: 'normal' as const, label: null }]) {
  return { id, name, ingredients, deleted_at: null, created_at: '2024-01-01T00:00:00Z' }
}

beforeEach(() => jest.clearAllMocks())

describe('importRecipes', () => {
  it('returns empty result for empty input without calling Supabase', async () => {
    const result = await importRecipes([], [])
    expect(result).toEqual({ imported: [], merged: [], failed: [] })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('inserts all new recipes when no duplicates', async () => {
    const r1 = makeRecipe('r1', 'Pasta Night')
    const r2 = makeRecipe('r2', 'Taco Tuesday')
    const r3 = makeRecipe('r3', 'Smoothie Bowl')

    // Each addRecipe does insert().select().single() — set up 3 sequential single() returns
    let call = 0
    const recipes = [r1, r2, r3]
    const chain: Record<string, jest.Mock> = {}
    const methods = ['from', 'select', 'insert', 'update', 'is', 'eq', 'order']
    methods.forEach((m) => { chain[m] = jest.fn(() => chain) })
    chain['single'] = jest.fn(() => Promise.resolve({ data: recipes[call++], error: null }))
    mockFrom.mockReturnValue(chain)

    const validated = [
      { name: 'Pasta Night', ingredients: r1.ingredients },
      { name: 'Taco Tuesday', ingredients: r2.ingredients },
      { name: 'Smoothie Bowl', ingredients: r3.ingredients },
    ]
    const result = await importRecipes(validated, [])
    expect(result.imported).toHaveLength(3)
    expect(result.merged).toHaveLength(0)
    expect(result.failed).toHaveLength(0)
  })

  it('merges when name matches existing recipe — adds ingredient counts', async () => {
    const existing = makeRecipe('r1', 'Pasta Night', [{ name: 'Milk', count: 2, priority: 'normal', label: null }])
    const merged = makeRecipe('r1', 'Pasta Night', [{ name: 'Milk', count: 5, priority: 'normal', label: null }])
    makeChain(merged)

    const result = await importRecipes(
      [{ name: 'Pasta Night', ingredients: [{ name: 'Milk', count: 3, priority: 'normal', label: null }] }],
      [existing]
    )
    expect(result.merged).toHaveLength(1)
    expect(result.imported).toHaveLength(0)
    // updateRecipe sends merged ingredients
    const chain = mockFrom.mock.results[0].value as Record<string, jest.Mock>
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ ingredients: [{ name: 'Milk', count: 5, priority: 'normal', label: null }] })
    )
  })

  it('merges by appending new ingredient when name differs', async () => {
    const existing = makeRecipe('r1', 'Pasta Night', [{ name: 'Milk', count: 2, priority: 'normal', label: null }])
    const mergedRecipe = makeRecipe('r1', 'Pasta Night', [
      { name: 'Milk', count: 2, priority: 'normal', label: null },
      { name: 'Eggs', count: 6, priority: 'normal', label: null },
    ])
    makeChain(mergedRecipe)

    await importRecipes(
      [{ name: 'Pasta Night', ingredients: [{ name: 'Eggs', count: 6, priority: 'normal', label: null }] }],
      [existing]
    )
    const chain = mockFrom.mock.results[0].value as Record<string, jest.Mock>
    const updateArg = chain.update.mock.calls[0][0]
    expect(updateArg.ingredients).toHaveLength(2)
    expect(updateArg.ingredients[1].name).toBe('Eggs')
  })

  it('duplicate match is case-insensitive', async () => {
    const existing = makeRecipe('r1', 'pasta night')
    const mergedRecipe = makeRecipe('r1', 'pasta night')
    makeChain(mergedRecipe)

    const result = await importRecipes(
      [{ name: 'Pasta Night', ingredients: existing.ingredients }],
      [existing]
    )
    expect(result.merged).toHaveLength(1)
  })

  it('continues processing on partial failure — collects failed entry', async () => {
    const r1 = makeRecipe('r1', 'Recipe A')
    const r3 = makeRecipe('r3', 'Recipe C')
    let call = 0
    const chain: Record<string, jest.Mock> = {}
    const methods = ['from', 'select', 'insert', 'update', 'is', 'eq', 'order']
    methods.forEach((m) => { chain[m] = jest.fn(() => chain) })
    chain['single'] = jest.fn(() => {
      if (call === 0) { call++; return Promise.resolve({ data: r1, error: null }) }
      if (call === 1) { call++; return Promise.resolve({ data: null, error: new Error('db error') }) }
      call++; return Promise.resolve({ data: r3, error: null })
    })
    mockFrom.mockReturnValue(chain)

    const validated = [
      { name: 'Recipe A', ingredients: r1.ingredients },
      { name: 'Recipe B', ingredients: r1.ingredients },
      { name: 'Recipe C', ingredients: r1.ingredients },
    ]
    const result = await importRecipes(validated, [])
    expect(result.imported).toHaveLength(2)
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0].index).toBe(1)
    expect(result.failed[0].name).toBe('Recipe B')
  })

  it('all fail — returns all in failed array', async () => {
    const chain: Record<string, jest.Mock> = {}
    const methods = ['from', 'select', 'insert', 'update', 'is', 'eq', 'order']
    methods.forEach((m) => { chain[m] = jest.fn(() => chain) })
    chain['single'] = jest.fn(() => Promise.resolve({ data: null, error: new Error('network') }))
    mockFrom.mockReturnValue(chain)

    const ing = [{ name: 'Milk', count: 1, priority: 'normal' as const, label: null }]
    const result = await importRecipes(
      [{ name: 'A', ingredients: ing }, { name: 'B', ingredients: ing }, { name: 'C', ingredients: ing }],
      []
    )
    expect(result.imported).toHaveLength(0)
    expect(result.merged).toHaveLength(0)
    expect(result.failed).toHaveLength(3)
  })
})

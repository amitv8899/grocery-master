import { fetchItems, addItem, updateItem, checkItem, clearBoughtItems } from '../itemsService'

// Chainable Supabase mock builder
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, jest.Mock> = {}
  const methods = ['from', 'select', 'insert', 'update', 'delete', 'is', 'eq', 'order', 'single']
  methods.forEach((m) => {
    chain[m] = jest.fn(() => chain)
  })
  // Terminal: single / bare await
  chain['single'] = jest.fn(() => Promise.resolve(result))
  // Make the chain itself thenable (for calls that don't use .single())
  Object.assign(chain, { then: undefined }) // not a promise itself

  // Override specific terminals for non-single queries
  chain['order'] = jest.fn(() => Promise.resolve(result))
  chain['is'] = jest.fn(() => chain)
  chain['eq'] = jest.fn(() => chain)

  return chain
}

jest.mock('../supabaseClient', () => ({
  supabase: { from: jest.fn() },
}))

import { supabase } from '../supabaseClient'

const mockFrom = supabase.from as jest.Mock

function setupChain(result: { data?: unknown; error?: unknown }) {
  const chain = makeChain(result)
  mockFrom.mockReturnValue(chain)
  return chain
}

describe('fetchItems', () => {
  it('calls .is("deleted_at", null)', async () => {
    const chain = setupChain({ data: [], error: null })
    // order is terminal here — returns promise
    await fetchItems().catch(() => {})
    expect(chain.is).toHaveBeenCalledWith('deleted_at', null)
  })

  it('calls .order("created_at", { ascending: true })', async () => {
    const chain = setupChain({ data: [], error: null })
    await fetchItems().catch(() => {})
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true })
  })

  it('throws on error', async () => {
    const chain = setupChain({ data: null, error: new Error('db error') })
    // make order resolve with error
    chain.order = jest.fn(() => Promise.resolve({ data: null, error: new Error('db error') }))
    mockFrom.mockReturnValue(chain)
    await expect(fetchItems()).rejects.toBeTruthy()
  })
})

describe('addItem', () => {
  it('passes data to insert', async () => {
    const chain = setupChain({ data: { id: '1' }, error: null })
    chain.single = jest.fn(() => Promise.resolve({ data: { id: '1' }, error: null }))
    chain.select = jest.fn(() => chain)
    chain.insert = jest.fn(() => chain)
    mockFrom.mockReturnValue(chain)

    const payload = { name: 'Milk', count: 2, priority: 'normal' as const, label: null }
    await addItem(payload).catch(() => {})
    expect(chain.insert).toHaveBeenCalledWith(payload)
  })

  it('throws on Supabase error', async () => {
    const chain = setupChain({ data: null, error: null })
    chain.single = jest.fn(() => Promise.resolve({ data: null, error: new Error('fail') }))
    chain.select = jest.fn(() => chain)
    chain.insert = jest.fn(() => chain)
    mockFrom.mockReturnValue(chain)
    await expect(addItem({ name: 'x', count: 1, priority: 'normal', label: null })).rejects.toBeTruthy()
  })
})

describe('updateItem', () => {
  it('targets correct row with .eq("id", id)', async () => {
    const chain = setupChain({ data: {}, error: null })
    chain.single = jest.fn(() => Promise.resolve({ data: {}, error: null }))
    chain.select = jest.fn(() => chain)
    chain.update = jest.fn(() => chain)
    chain.eq = jest.fn(() => chain)
    mockFrom.mockReturnValue(chain)

    await updateItem('abc-123', { name: 'Bread' }).catch(() => {})
    expect(chain.eq).toHaveBeenCalledWith('id', 'abc-123')
  })
})

describe('checkItem', () => {
  it('updates only checked=true', async () => {
    const chain = setupChain({ data: null, error: null })
    chain.update = jest.fn(() => chain)
    chain.eq = jest.fn(() => Promise.resolve({ data: null, error: null }))
    mockFrom.mockReturnValue(chain)

    await checkItem('xyz').catch(() => {})
    expect(chain.update).toHaveBeenCalledWith({ checked: true })
  })
})

describe('clearBoughtItems', () => {
  it('filters .eq("checked", true) and .is("deleted_at", null)', async () => {
    const chain = setupChain({ data: null, error: null })
    chain.update = jest.fn(() => chain)
    chain.eq = jest.fn(() => chain)
    chain.is = jest.fn(() => Promise.resolve({ data: null, error: null }))
    mockFrom.mockReturnValue(chain)

    await clearBoughtItems().catch(() => {})
    expect(chain.eq).toHaveBeenCalledWith('checked', true)
    expect(chain.is).toHaveBeenCalledWith('deleted_at', null)
  })
})

jest.mock('../supabaseClient', () => ({
  supabase: { from: jest.fn() },
}))

import { lookupCatalog, upsertCatalog } from '../catalogService'
import { supabase } from '../supabaseClient'

const mockFrom = supabase.from as jest.Mock

function makeSelectChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, jest.Mock> = {}
  chain.select = jest.fn(() => chain)
  chain.eq = jest.fn(() => chain)
  chain.maybeSingle = jest.fn(() => Promise.resolve(result))
  mockFrom.mockReturnValue(chain)
  return chain
}

function makeUpsertChain(result: { error?: unknown }) {
  const chain: Record<string, jest.Mock> = {}
  chain.upsert = jest.fn(() => Promise.resolve(result))
  mockFrom.mockReturnValue(chain)
  return chain
}

beforeEach(() => jest.clearAllMocks())

describe('lookupCatalog', () => {
  it('returns tag_name when found', async () => {
    makeSelectChain({ data: { tag_name: 'Dairy' }, error: null })
    await expect(lookupCatalog('Milk')).resolves.toBe('Dairy')
  })

  it('returns null when no catalog entry', async () => {
    makeSelectChain({ data: null, error: null })
    await expect(lookupCatalog('Bread')).resolves.toBeNull()
  })

  it('normalizes key to lowercase before query', async () => {
    const chain = makeSelectChain({ data: null, error: null })
    await lookupCatalog('MILK').catch(() => {})
    expect(chain.eq).toHaveBeenCalledWith('name', 'milk')
  })

  it('trims whitespace from key', async () => {
    const chain = makeSelectChain({ data: null, error: null })
    await lookupCatalog('  milk  ').catch(() => {})
    expect(chain.eq).toHaveBeenCalledWith('name', 'milk')
  })

  it('returns null for empty string without hitting DB', async () => {
    await expect(lookupCatalog('')).resolves.toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('throws on supabase error', async () => {
    makeSelectChain({ data: null, error: new Error('db error') })
    await expect(lookupCatalog('Milk')).rejects.toBeTruthy()
  })
})

describe('upsertCatalog', () => {
  it('calls upsert with lowercased key and tag_name', async () => {
    const chain = makeUpsertChain({ error: null })
    await upsertCatalog('Milk', 'Dairy')
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'milk', tag_name: 'Dairy' }),
      { onConflict: 'name' }
    )
  })

  it('trims whitespace from key', async () => {
    const chain = makeUpsertChain({ error: null })
    await upsertCatalog('  Milk  ', 'Dairy')
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'milk' }),
      expect.anything()
    )
  })

  it('returns early for empty name without hitting DB', async () => {
    await upsertCatalog('', 'Dairy')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('throws on supabase error', async () => {
    makeUpsertChain({ error: new Error('db error') })
    await expect(upsertCatalog('Milk', 'Dairy')).rejects.toBeTruthy()
  })
})

import { groupItems } from '../groupItems'
import type { Item } from '../types'

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: Math.random().toString(),
    name: 'item',
    count: 1,
    priority: 'normal',
    checked: false,
    label: null,
    deleted_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('groupItems', () => {
  it('filters out checked items', () => {
    const items = [makeItem({ checked: false }), makeItem({ checked: true })]
    const { groups } = groupItems(items)
    expect(groups.flatMap((g) => g.items)).toHaveLength(1)
  })

  it('filters out deleted items', () => {
    const items = [makeItem({ deleted_at: null }), makeItem({ deleted_at: new Date().toISOString() })]
    const { groups } = groupItems(items)
    expect(groups.flatMap((g) => g.items)).toHaveLength(1)
  })

  it('null label → "Empty label" group is last', () => {
    const items = [
      makeItem({ label: 'Dairy', created_at: '2024-01-01T00:00:00Z' }),
      makeItem({ label: null, created_at: '2024-01-02T00:00:00Z' }),
    ]
    const { groups } = groupItems(items)
    expect(groups[groups.length - 1].label).toBe('Empty label')
  })

  it('sorts within group: high → normal → low', () => {
    const items = [
      makeItem({ label: 'Produce', priority: 'low', created_at: '2024-01-01T00:00:00Z' }),
      makeItem({ label: 'Produce', priority: 'high', created_at: '2024-01-02T00:00:00Z' }),
      makeItem({ label: 'Produce', priority: 'normal', created_at: '2024-01-03T00:00:00Z' }),
    ]
    const { groups } = groupItems(items)
    expect(groups[0].items.map((i) => i.priority)).toEqual(['high', 'normal', 'low'])
  })

  it('sorts same-priority items by created_at ASC', () => {
    const older = makeItem({ label: 'Produce', priority: 'high', created_at: '2024-01-01T00:00:00Z', name: 'older' })
    const newer = makeItem({ label: 'Produce', priority: 'high', created_at: '2024-01-02T00:00:00Z', name: 'newer' })
    const { groups } = groupItems([newer, older])
    expect(groups[0].items[0].name).toBe('older')
  })

  it('orders known tag groups by TAGS sortOrder (Produce before Dairy)', () => {
    const items = [
      makeItem({ label: 'Dairy', created_at: '2024-01-01T00:00:00Z' }),
      makeItem({ label: 'Produce', created_at: '2024-01-02T00:00:00Z' }),
    ]
    const { groups } = groupItems(items)
    expect(groups[0].label).toBe('Produce')
    expect(groups[1].label).toBe('Dairy')
  })

  it('separates checked items into boughtItems', () => {
    const items = [makeItem({ checked: false }), makeItem({ checked: true, label: 'Dairy' })]
    const { boughtItems } = groupItems(items)
    expect(boughtItems).toHaveLength(1)
  })
})

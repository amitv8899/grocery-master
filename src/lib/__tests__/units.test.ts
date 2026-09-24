import { UNITS, getUnit, roundQuantity, formatQuantity } from '../units'

describe('getUnit', () => {
  it('returns the matching unit option', () => {
    expect(getUnit('g')).toEqual({ value: 'g', label: 'g', step: 50 })
  })

  it('falls back to the first unit ("count") for an unknown value', () => {
    expect(getUnit('unknown')).toEqual(UNITS[0])
  })
})

describe('roundQuantity', () => {
  it('rounds to 2 decimal places, avoiding float drift', () => {
    expect(roundQuantity(0.1 + 0.2)).toBe(0.3)
  })
})

describe('formatQuantity', () => {
  it('renders a bare number for the "count" unit', () => {
    expect(formatQuantity(3, 'count')).toBe('3')
  })

  it('appends the unit label for non-count units', () => {
    expect(formatQuantity(500, 'g')).toBe('500 g')
    expect(formatQuantity(1.5, 'l')).toBe('1.5 L')
  })
})

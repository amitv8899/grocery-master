export type Unit = 'count' | 'g' | 'kg' | 'ml' | 'l' | 'oz'

export type UnitOption = {
  value: Unit
  label: string
  step: number
}

export const UNITS: UnitOption[] = [
  { value: 'count', label: 'Count', step: 1 },
  { value: 'g', label: 'g', step: 50 },
  { value: 'kg', label: 'kg', step: 0.5 },
  { value: 'ml', label: 'ml', step: 100 },
  { value: 'l', label: 'L', step: 0.5 },
  { value: 'oz', label: 'oz', step: 1 },
]

export function getUnit(value: string): UnitOption {
  return UNITS.find((u) => u.value === value) ?? UNITS[0]
}

export function roundQuantity(n: number): number {
  return Math.round(n * 100) / 100
}

export function formatQuantity(count: number, unit: string): string {
  const u = getUnit(unit)
  if (u.value === 'count') return String(count)
  return `${roundQuantity(count)} ${u.label}`
}

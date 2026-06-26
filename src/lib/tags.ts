export type Tag = {
  name: string
  color: string
  bgColor: string
  textColor: string
  sortOrder: number
}

export const TAGS: Tag[] = [
  { name: 'Produce',   color: '#639922', bgColor: '#EAF3DE', textColor: '#27500A', sortOrder: 0 },
  { name: 'Dairy',     color: '#378ADD', bgColor: '#E6F1FB', textColor: '#0C447C', sortOrder: 1 },
  { name: 'Meat',      color: '#B94040', bgColor: '#FAECE7', textColor: '#712B13', sortOrder: 2 },
  { name: 'Bakery',    color: '#BA7517', bgColor: '#FAEEDA', textColor: '#633806', sortOrder: 3 },
  { name: 'Frozen',    color: '#2B8F9E', bgColor: '#E0F4F7', textColor: '#0A4A52', sortOrder: 4 },
  { name: 'Drinks',    color: '#7B52AB', bgColor: '#EDE6F5', textColor: '#3D1573', sortOrder: 5 },
  { name: 'Household', color: '#8B6914', bgColor: '#F5EDD8', textColor: '#4A3508', sortOrder: 6 },
  { name: 'Other',     color: '#888888', bgColor: '#F2F2F2', textColor: '#444444', sortOrder: 7 },
]

export const NEUTRAL_TAG_COLOR = { color: '#AAAAAA', bgColor: '#F0F0F0', textColor: '#666666' }

export function getTagByName(name: string | null): Tag | null {
  if (!name) return null
  return TAGS.find((t) => t.name === name) ?? null
}

export function getTagColor(name: string | null) {
  const tag = getTagByName(name)
  if (!tag) return NEUTRAL_TAG_COLOR
  return { color: tag.color, bgColor: tag.bgColor, textColor: tag.textColor }
}

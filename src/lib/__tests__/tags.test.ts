import { TAGS, getTagByName, getTagColor, NEUTRAL_TAG_COLOR } from '../tags'

describe('TAGS', () => {
  it('has 8 tags', () => {
    expect(TAGS).toHaveLength(8)
  })

  it('sortOrder values are unique and sequential from 0', () => {
    const orders = TAGS.map((t) => t.sortOrder).sort((a, b) => a - b)
    expect(orders).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('every tag has name, color, bgColor, textColor', () => {
    TAGS.forEach((t) => {
      expect(t.name).toBeTruthy()
      expect(t.color).toBeTruthy()
      expect(t.bgColor).toBeTruthy()
      expect(t.textColor).toBeTruthy()
    })
  })
})

describe('getTagByName', () => {
  it('returns tag for known name', () => {
    const tag = getTagByName('Produce')
    expect(tag).not.toBeNull()
    expect(tag!.name).toBe('Produce')
    expect(tag!.sortOrder).toBe(0)
  })

  it('returns null for unknown name', () => {
    expect(getTagByName('Candy')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(getTagByName(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(getTagByName('')).toBeNull()
  })

  it('is case-sensitive (title case required)', () => {
    expect(getTagByName('produce')).toBeNull()
    expect(getTagByName('PRODUCE')).toBeNull()
  })
})

describe('getTagColor', () => {
  it('returns correct colors for known tag', () => {
    const colors = getTagColor('Dairy')
    const dairyTag = TAGS.find((t) => t.name === 'Dairy')!
    expect(colors.color).toBe(dairyTag.color)
    expect(colors.bgColor).toBe(dairyTag.bgColor)
    expect(colors.textColor).toBe(dairyTag.textColor)
  })

  it('returns NEUTRAL_TAG_COLOR for unknown tag', () => {
    expect(getTagColor('Unknown')).toEqual(NEUTRAL_TAG_COLOR)
  })

  it('returns NEUTRAL_TAG_COLOR for null', () => {
    expect(getTagColor(null)).toEqual(NEUTRAL_TAG_COLOR)
  })
})

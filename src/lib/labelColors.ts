type LabelColor = { dot: string; bg: string; text: string }

const PALETTE: LabelColor[] = [
  { dot: '#378ADD', bg: '#E6F1FB', text: '#0C447C' },
  { dot: '#639922', bg: '#EAF3DE', text: '#27500A' },
  { dot: '#BA7517', bg: '#FAEEDA', text: '#633806' },
  { dot: '#B94040', bg: '#FAECE7', text: '#712B13' },
  { dot: '#7B52AB', bg: '#EDE6F5', text: '#3D1573' },
  { dot: '#2B8F9E', bg: '#E0F4F7', text: '#0A4A52' },
]

export function getLabelColor(label: string): LabelColor {
  let hash = 0
  for (let i = 0; i < label.length; i++) hash += label.charCodeAt(i)
  return PALETTE[hash % PALETTE.length]
}

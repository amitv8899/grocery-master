'use client'

import { TAGS } from '@/lib/tags'
import BottomSheet from './BottomSheet'

type Props = {
  open: boolean
  currentTag: string | null
  onSelect: (tagName: string | null) => void
  onClose: () => void
}

export default function TagPickerSheet({ open, currentTag, onSelect, onClose }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <p className="text-base font-medium text-warm-text mb-4">Pick category</p>
      <div className="grid grid-cols-2 gap-2">
        {TAGS.map((tag) => (
          <button
            key={tag.name}
            onClick={() => onSelect(tag.name)}
            className={`flex items-center gap-2 px-3 py-3 rounded-xl border transition-colors ${
              currentTag === tag.name ? 'border-[2px]' : 'border-warm-muted'
            }`}
            style={
              currentTag === tag.name
                ? { background: tag.bgColor, borderColor: tag.color }
                : undefined
            }
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: tag.color }} />
            <span className="text-sm text-warm-text">{tag.name}</span>
            {currentTag === tag.name && (
              <span className="ml-auto text-xs" style={{ color: tag.color }}>✓</span>
            )}
          </button>
        ))}
      </div>
      <button
        onClick={() => onSelect(null)}
        className="mt-3 w-full py-3 text-sm text-warm-sub text-center"
      >
        No category
      </button>
    </BottomSheet>
  )
}

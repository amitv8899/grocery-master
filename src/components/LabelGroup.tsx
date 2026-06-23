'use client'

import type { Item } from '@/lib/types'
import { getTagColor } from '@/lib/tags'
import ItemRow from './ItemRow'

type Props = {
  label: string
  items: Item[]
  onCheck: (id: string) => void
  onUpdate: (id: string, data: Partial<Pick<Item, 'name' | 'count' | 'priority' | 'label'>>) => void
  onDelete: (id: string) => void
  onTagChange: (id: string, tagName: string | null) => void
}

export default function LabelGroup({ label, items, onCheck, onUpdate, onDelete, onTagChange }: Props) {
  const tagColor = getTagColor(label === 'Empty label' ? null : label)

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 px-1 pt-2.5 pb-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: tagColor.color }}
        />
        <span className="text-[10px] font-semibold tracking-widest uppercase text-warm-sub">
          {label === 'Empty label' ? 'No category' : label}
        </span>
      </div>
      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          onCheck={() => onCheck(item.id)}
          onUpdate={(data) => onUpdate(item.id, data)}
          onDelete={() => onDelete(item.id)}
          onTagChange={(tagName) => onTagChange(item.id, tagName)}
        />
      ))}
    </div>
  )
}

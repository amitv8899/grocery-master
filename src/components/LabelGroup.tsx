'use client'

import type { Item } from '@/lib/types'
import { getLabelColor } from '@/lib/labelColors'
import ItemRow from './ItemRow'

type Props = {
  label: string
  items: Item[]
  onCheck: (id: string) => void
  onUpdate: (id: string, data: Partial<Pick<Item, 'name' | 'count' | 'priority' | 'label'>>) => void
  onDelete: (id: string) => void
}

export default function LabelGroup({ label, items, onCheck, onUpdate, onDelete }: Props) {
  const color = getLabelColor(label)

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 px-1 pt-2.5 pb-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: color.dot }}
        />
        <span className="text-[10px] font-semibold tracking-widest uppercase text-warm-sub">
          {label}
        </span>
      </div>
      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          labelColor={color}
          onCheck={() => onCheck(item.id)}
          onUpdate={(data) => onUpdate(item.id, data)}
          onDelete={() => onDelete(item.id)}
        />
      ))}
    </div>
  )
}

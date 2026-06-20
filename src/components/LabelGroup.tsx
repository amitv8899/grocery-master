'use client'

import type { Item } from '@/lib/types'
import ItemRow from './ItemRow'

type Props = {
  label: string
  items: Item[]
  onCheck: (id: string) => void
  onUpdate: (id: string, data: Partial<Pick<Item, 'name' | 'count' | 'priority' | 'label'>>) => void
}

export default function LabelGroup({ label, items, onCheck, onUpdate }: Props) {
  return (
    <div className="mb-4">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1">
        {label}
      </h2>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onCheck={() => onCheck(item.id)}
            onUpdate={(data) => onUpdate(item.id, data)}
          />
        ))}
      </div>
    </div>
  )
}

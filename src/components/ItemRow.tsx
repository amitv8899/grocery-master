'use client'

import { useState } from 'react'
import type { Item, Priority } from '@/lib/types'

type Props = {
  item: Item
  onCheck: () => void
  onUpdate: (data: Partial<Pick<Item, 'name' | 'count' | 'priority' | 'label'>>) => void
}

const priorityDot: Record<Priority, string> = {
  high: 'bg-red-500',
  normal: 'bg-gray-400',
  low: 'bg-green-500',
}

export default function ItemRow({ item, onCheck, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [count, setCount] = useState(item.count)
  const [priority, setPriority] = useState<Priority>(item.priority)
  const [label, setLabel] = useState(item.label ?? '')

  function handleSave() {
    onUpdate({
      name: name.trim() || item.name,
      count: count >= 1 ? count : item.count,
      priority,
      label: label.trim() || null,
    })
    setEditing(false)
  }

  function handleCancel() {
    setName(item.name)
    setCount(item.count)
    setPriority(item.priority)
    setLabel(item.label ?? '')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 py-3 px-2 border-b border-gray-100">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Math.floor(Number(e.target.value)))}
            className="w-20 h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="flex-1 h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 h-10 bg-gray-900 text-white rounded-md text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 h-10 border border-gray-300 text-gray-700 rounded-md text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 py-3 px-2 border-b border-gray-100 min-h-12">
      <input
        type="checkbox"
        checked={false}
        onChange={onCheck}
        className="w-5 h-5 flex-shrink-0 cursor-pointer accent-gray-900"
      />
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityDot[item.priority]}`} />
      <span className={`flex-1 text-sm text-gray-900 ${item.priority === 'high' ? 'font-bold' : ''}`}>
        {item.name}
      </span>
      {item.count > 1 && (
        <span className="text-xs text-gray-500 flex-shrink-0">×{item.count}</span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-700 text-xs px-2 py-1"
        aria-label="Edit item"
      >
        ✏️
      </button>
    </div>
  )
}

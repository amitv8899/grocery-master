'use client'

import { useState } from 'react'
import { IconTrash } from '@tabler/icons-react'
import type { Item, Priority } from '@/lib/types'
import { getTagColor } from '@/lib/tags'
import TagPickerSheet from './TagPickerSheet'

type Props = {
  item: Item
  onCheck: () => void
  onUncheck?: () => void
  onUpdate: (data: Partial<Pick<Item, 'name' | 'count' | 'priority' | 'label'>>) => void
  onDelete: () => void
  onTagChange: (tagName: string | null) => void
}

const priorityRank: Record<Priority, string> = {
  high: '#1',
  normal: '#2',
  low: '#3',
}

export default function ItemRow({ item, onCheck, onUncheck, onUpdate, onDelete, onTagChange }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [priority, setPriority] = useState<Priority>(item.priority)
  const [tagPickerOpen, setTagPickerOpen] = useState(false)

  const tagColor = getTagColor(item.label)

  function handleSave() {
    onUpdate({ name: name.trim() || item.name, priority })
    setEditing(false)
  }

  function handleCancel() {
    setName(item.name)
    setPriority(item.priority)
    setEditing(false)
  }

  function handleDecrement() {
    if (item.count <= 1) return
    onUpdate({ count: item.count - 1 })
  }

  function handleIncrement() {
    onUpdate({ count: item.count + 1 })
  }

  function handleTagSelect(tagName: string | null) {
    onTagChange(tagName)
    setTagPickerOpen(false)
  }

  if (editing) {
    return (
      <div className="bg-warm-card rounded-xl border border-warm-border mb-1.5 p-3 flex flex-col gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="w-full h-10 px-3 bg-warm-bg border border-warm-muted rounded-lg text-sm text-warm-text focus:outline-none focus:ring-2 focus:ring-accent-green"
        />
        <div className="flex gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="flex-1 h-10 px-2 bg-warm-bg border border-warm-muted rounded-lg text-sm text-warm-text focus:outline-none focus:ring-2 focus:ring-accent-green"
          >
            <option value="high">#1 — High</option>
            <option value="normal">#2 — Normal</option>
            <option value="low">#3 — Low</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 h-10 bg-warm-text text-white rounded-lg text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 h-10 border border-warm-muted text-warm-sub rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-warm-card rounded-xl border border-warm-border mb-1.5 flex items-center overflow-hidden">
        {/* Checkbox strip */}
        <button
          onClick={item.checked && onUncheck ? onUncheck : onCheck}
          aria-label={item.checked ? 'Mark as not bought' : 'Mark as bought'}
          className="w-[52px] self-stretch border-r border-warm-border flex items-center justify-center flex-shrink-0"
        >
          <span
            className={`w-[22px] h-[22px] rounded-md border-[1.5px] flex items-center justify-center text-[13px] transition-colors ${
              item.checked
                ? 'bg-accent-green border-accent-green text-white'
                : 'border-warm-muted'
            }`}
          >
            {item.checked && '✓'}
          </span>
        </button>

        {/* Content */}
        <button
          onClick={() => !item.checked && setEditing(true)}
          className="flex-1 px-2.5 py-2.5 min-w-0 text-left"
          disabled={item.checked}
        >
          <div
            className={`text-sm truncate ${
              item.checked ? 'line-through text-warm-fade' : 'text-warm-text'
            }`}
          >
            {item.name}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {!item.checked && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setTagPickerOpen(true)
                }}
                className="text-[11px] rounded-[5px] px-1.5 py-0.5 flex items-center gap-1"
                style={{ background: tagColor.bgColor, color: tagColor.textColor }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: tagColor.color }}
                />
                {item.label ?? 'Add tag'}
              </button>
            )}
            {item.checked && item.label && (
              <span
                className="text-[11px] rounded-[5px] px-1.5 py-0.5"
                style={{ background: tagColor.bgColor, color: tagColor.textColor }}
              >
                {item.label}
              </span>
            )}
            <span className="text-[11px] text-warm-fade">{priorityRank[item.priority]}</span>
          </div>
        </button>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 pr-2.5 flex-shrink-0">
          {/* Counter */}
          <div
            className={`flex items-center bg-warm-bg border border-warm-muted rounded-lg overflow-hidden h-[34px] transition-opacity ${
              item.checked ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <button
              onClick={handleDecrement}
              className="w-[34px] h-[34px] flex items-center justify-center text-lg text-warm-sub hover:bg-warm-border"
            >
              −
            </button>
            <span className="w-[26px] text-center text-sm font-medium text-warm-text">
              {item.count}
            </span>
            <button
              onClick={handleIncrement}
              className="w-[34px] h-[34px] flex items-center justify-center text-lg text-warm-sub hover:bg-warm-border"
            >
              +
            </button>
          </div>

          {/* Delete */}
          <button
            onClick={onDelete}
            aria-label="Delete item"
            className="w-8 h-8 flex items-center justify-center text-warm-fade rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      <TagPickerSheet
        open={tagPickerOpen}
        currentTag={item.label}
        onSelect={handleTagSelect}
        onClose={() => setTagPickerOpen(false)}
      />
    </>
  )
}

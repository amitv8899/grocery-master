'use client'

import { useState } from 'react'
import { addItem } from '@/lib/itemsService'
import { lookupCatalog, upsertCatalog } from '@/lib/catalogService'
import { getTagColor } from '@/lib/tags'
import type { Item, Priority } from '@/lib/types'
import TagPickerSheet from './TagPickerSheet'

type Props = {
  onAdd: (item: Item) => void
}

export default function AddItemForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [count, setCount] = useState(1)
  const [priority, setPriority] = useState<Priority>('normal')
  const [tag, setTag] = useState<string | null>(null)
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [nameError, setNameError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const tagColor = getTagColor(tag)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameError('')
    if (!name.trim()) {
      setNameError('Name is required')
      return
    }
    submitItem()
  }

  async function handleNameBlur() {
    if (!name.trim()) return
    try {
      const remembered = await lookupCatalog(name.trim())
      if (remembered && !tag) setTag(remembered)
    } catch {
      // catalog lookup is non-critical — ignore errors
    }
  }

  async function submitItem() {
    setSubmitting(true)
    try {
      let resolvedTag = tag
      if (!resolvedTag && name.trim()) {
        resolvedTag = await lookupCatalog(name.trim()).catch(() => null)
      }
      const item = await addItem({
        name: name.trim(),
        count,
        priority,
        label: resolvedTag,
      })
      if (resolvedTag) await upsertCatalog(name.trim(), resolvedTag).catch(() => {})
      onAdd(item)
      setName('')
      setCount(1)
      setPriority('normal')
      setTag(null)
    } catch {
      setNameError('Failed to add item. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <p className="text-base font-medium text-warm-text mb-4">Add item</p>

        <p className="text-[10px] font-semibold tracking-[0.8px] uppercase text-warm-sub mb-1.5">Name</p>
        <div className="mb-3.5">
          <input
            type="text"
            placeholder="e.g. Chicken breast"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            className="w-full bg-warm-bg border border-warm-muted rounded-xl px-3 py-[11px] text-sm text-warm-text placeholder:text-warm-fade focus:outline-none focus:ring-2 focus:ring-accent-green"
          />
          {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
        </div>

        <p className="text-[10px] font-semibold tracking-[0.8px] uppercase text-warm-sub mb-1.5">Count</p>
        <div className="flex items-center bg-warm-bg border border-warm-muted rounded-xl mb-3.5 overflow-hidden h-[52px]">
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            className="flex-none w-16 h-full flex items-center justify-center text-[28px] text-warm-sub hover:bg-warm-border"
          >
            −
          </button>
          <span className="flex-1 text-center text-[22px] font-medium text-warm-text">{count}</span>
          <button
            type="button"
            onClick={() => setCount((c) => c + 1)}
            className="flex-none w-16 h-full flex items-center justify-center text-[28px] text-warm-sub hover:bg-warm-border"
          >
            +
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.8px] uppercase text-warm-sub mb-1.5">Category</p>
            <button
              type="button"
              onClick={() => setTagPickerOpen(true)}
              className="w-full bg-warm-bg border border-warm-muted rounded-xl px-3 py-[11px] text-sm text-left flex items-center gap-2"
              style={{ color: tag ? tagColor.textColor : undefined }}
            >
              {tag ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: tagColor.color }} />
                  <span>{tag}</span>
                </>
              ) : (
                <span className="text-warm-fade">e.g. Dairy</span>
              )}
            </button>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.8px] uppercase text-warm-sub mb-1.5">Priority</p>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full bg-warm-bg border border-warm-muted rounded-xl px-3 py-[11px] text-sm text-warm-text focus:outline-none focus:ring-2 focus:ring-accent-green appearance-none"
            >
              <option value="high">#1 — High</option>
              <option value="normal">#2 — Normal</option>
              <option value="low">#3 — Low</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-[14px] rounded-xl bg-warm-text text-white text-[15px] font-medium disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add to list'}
        </button>
      </form>

      <TagPickerSheet
        open={tagPickerOpen}
        currentTag={tag}
        onSelect={(tagName) => {
          setTag(tagName)
          setTagPickerOpen(false)
        }}
        onClose={() => setTagPickerOpen(false)}
      />
    </>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { addItem, updateItem } from '@/lib/itemsService'
import { lookupCatalog, upsertCatalog } from '@/lib/catalogService'
import { getTagColor } from '@/lib/tags'
import { UNITS, getUnit, formatQuantity, roundQuantity } from '@/lib/units'
import type { Item, Priority, Unit } from '@/lib/types'
import TagPickerSheet from './TagPickerSheet'

type Props = {
  items?: Item[]
  onAdd: (item: Item) => void
  onMerge?: (item: Item) => void
}

const MAX_SUGGESTIONS = 6

export default function AddItemForm({ items = [], onAdd, onMerge }: Props) {
  const [name, setName] = useState('')
  const [count, setCount] = useState(1)
  const [unit, setUnit] = useState<Unit>('count')
  const [priority, setPriority] = useState<Priority>('normal')
  const [tag, setTag] = useState<string | null>(null)
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [nameError, setNameError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false)

  const [suggestions, setSuggestions] = useState<Item[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [selectedExisting, setSelectedExisting] = useState<Item | null>(null)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    }
  }, [])

  const tagColor = getTagColor(tag)

  function findSuggestions(query: string): Item[] {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const matches = items.filter((i) => i.deleted_at === null && i.name.toLowerCase().includes(q))

    matches.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      const aStarts = aName.startsWith(q) ? 0 : 1
      const bStarts = bName.startsWith(q) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts
      if (a.checked !== b.checked) return a.checked ? 1 : -1
      return aName.localeCompare(bName)
    })

    const seen = new Set<string>()
    const deduped: Item[] = []
    for (const item of matches) {
      const key = item.name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push(item)
    }
    return deduped.slice(0, MAX_SUGGESTIONS)
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setName(value)
    setSelectedExisting(null)
    setHighlightedIndex(-1)
    const next = findSuggestions(value)
    setSuggestions(next)
    setShowSuggestions(next.length > 0)
  }

  function handleSelectSuggestion(item: Item) {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    setName(item.name)
    setSelectedExisting(item)
    if (item.label) setTag(item.label)
    setUnit(item.unit)
    setCount(getUnit(item.unit).step)
    setSuggestions([])
    setShowSuggestions(false)
    setHighlightedIndex(-1)
  }

  function handleUnitChange(next: Unit) {
    setUnit(next)
    setCount(getUnit(next).step)
  }

  function decrementCount() {
    const step = getUnit(unit).step
    setCount((c) => {
      const next = roundQuantity(c - step)
      return next < step ? step : next
    })
  }

  function incrementCount() {
    const step = getUnit(unit).step
    setCount((c) => roundQuantity(c + step))
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0) {
        e.preventDefault()
        handleSelectSuggestion(suggestions[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    }
  }

  function handleNameFocus() {
    const next = findSuggestions(name)
    if (next.length > 0) {
      setSuggestions(next)
      setShowSuggestions(true)
    }
  }

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
    blurTimeoutRef.current = setTimeout(() => setShowSuggestions(false), 120)
    if (!name.trim()) return
    submittedRef.current = false
    try {
      const remembered = await lookupCatalog(name.trim())
      if (remembered && !tag && !submittedRef.current) setTag(remembered)
    } catch {
      // catalog lookup is non-critical — ignore errors
    }
  }

  async function submitItem() {
    submittedRef.current = true
    setSubmitting(true)
    try {
      const trimmedName = name.trim()
      const mergeTarget =
        selectedExisting && selectedExisting.name.trim().toLowerCase() === trimmedName.toLowerCase()
          ? selectedExisting
          : null

      if (mergeTarget && onMerge) {
        const updated = await updateItem(mergeTarget.id, {
          count: mergeTarget.count + count,
          checked: false,
        })
        onMerge(updated)
      } else {
        const userChoseTag = tag !== null
        let resolvedTag = tag
        if (!resolvedTag && trimmedName) {
          resolvedTag = await lookupCatalog(trimmedName).catch(() => null)
        }
        const item = await addItem({
          name: trimmedName,
          count,
          unit,
          priority,
          label: resolvedTag,
        })
        if (resolvedTag && userChoseTag) await upsertCatalog(trimmedName, resolvedTag).catch(() => {})
        onAdd(item)
      }
      setName('')
      setCount(1)
      setUnit('count')
      setPriority('normal')
      setTag(null)
      setSelectedExisting(null)
      setSuggestions([])
      setShowSuggestions(false)
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
        <div className="mb-3.5 relative">
          <input
            type="text"
            placeholder="e.g. Chicken breast"
            value={name}
            onChange={handleNameChange}
            onKeyDown={handleNameKeyDown}
            onFocus={handleNameFocus}
            onBlur={handleNameBlur}
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls="add-item-suggestions"
            aria-autocomplete="list"
            autoComplete="off"
            className="w-full bg-warm-bg border border-warm-muted rounded-xl px-3 py-[11px] text-sm text-warm-text placeholder:text-warm-fade focus:outline-none focus:ring-2 focus:ring-accent-green"
          />
          {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
          {!nameError && selectedExisting && (
            <p className="mt-1 text-xs text-accent-green">
              {selectedExisting.checked
                ? 'Already bought — this will add it back to your list'
                : `Already on your list (${formatQuantity(selectedExisting.count, selectedExisting.unit)}) — this will update the quantity`}
            </p>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <ul
              id="add-item-suggestions"
              role="listbox"
              className="absolute z-20 left-0 right-0 mt-1 bg-warm-card border border-warm-muted rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto"
            >
              {suggestions.map((item, idx) => {
                const color = getTagColor(item.label)
                return (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={idx === highlightedIndex}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectSuggestion(item)}
                    className={`px-3 py-2 text-sm flex items-center justify-between gap-2 cursor-pointer ${
                      idx === highlightedIndex ? 'bg-warm-bg' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {item.label && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: color.color }}
                        />
                      )}
                      <span className="truncate text-warm-text">{item.name}</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-warm-fade flex-shrink-0">
                      {item.checked ? 'Bought · add again' : `In list · ${formatQuantity(item.count, item.unit)}`}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <p className="text-[10px] font-semibold tracking-[0.8px] uppercase text-warm-sub mb-1.5">Count</p>
        <div className="flex items-stretch gap-2 mb-3.5">
          <div className="flex flex-1 items-center bg-warm-bg border border-warm-muted rounded-xl overflow-hidden h-[52px] min-w-0">
            <button
              type="button"
              onClick={decrementCount}
              className="flex-none w-16 h-full flex items-center justify-center text-[28px] text-warm-sub hover:bg-warm-border"
            >
              −
            </button>
            <span className="flex-1 text-center text-[18px] font-medium text-warm-text truncate px-1">
              {formatQuantity(count, unit)}
            </span>
            <button
              type="button"
              onClick={incrementCount}
              className="flex-none w-16 h-full flex items-center justify-center text-[28px] text-warm-sub hover:bg-warm-border"
            >
              +
            </button>
          </div>
          <select
            value={unit}
            onChange={(e) => handleUnitChange(e.target.value as Unit)}
            aria-label="Unit"
            className="flex-none w-[76px] h-[52px] bg-warm-bg border border-warm-muted rounded-xl px-1 text-sm text-warm-text focus:outline-none focus:ring-2 focus:ring-accent-green appearance-none text-center"
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
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

        <div className="sticky bottom-0 bg-warm-card pt-2 pb-[env(safe-area-inset-bottom)]">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-[14px] rounded-xl bg-warm-text text-white text-[15px] font-medium disabled:opacity-50"
          >
            {submitting ? 'Adding…' : selectedExisting ? 'Update list' : 'Add to list'}
          </button>
        </div>
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

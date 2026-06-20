'use client'

import { useState } from 'react'
import { addItem } from '@/lib/itemsService'
import type { Item, Priority } from '@/lib/types'

type Props = {
  onAdd: (item: Item) => void
}

export default function AddItemForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [count, setCount] = useState(1)
  const [priority, setPriority] = useState<Priority>('normal')
  const [label, setLabel] = useState('')
  const [nameError, setNameError] = useState('')
  const [countError, setCountError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameError('')
    setCountError('')

    let valid = true
    if (!name.trim()) {
      setNameError('Name is required')
      valid = false
    }
    if (!Number.isInteger(count) || count < 1) {
      setCountError('Count must be a positive integer')
      valid = false
    }
    if (!valid) return

    submitItem()
  }

  async function submitItem() {
    setSubmitting(true)
    try {
      const item = await addItem({
        name: name.trim(),
        count,
        priority,
        label: label.trim() || null,
      })
      onAdd(item)
      setName('')
      setCount(1)
      setPriority('normal')
      setLabel('')
    } catch (err) {
      setNameError('Failed to add item. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg bg-white">
      <div>
        <input
          type="text"
          placeholder="Item name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-12 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Math.floor(Number(e.target.value)))}
            className="w-full h-12 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          {countError && <p className="mt-1 text-xs text-red-600">{countError}</p>}
        </div>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="flex-1 h-12 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
      </div>

      <input
        type="text"
        placeholder="Label (optional)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full h-12 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />

      <button
        type="submit"
        disabled={submitting}
        className="h-12 bg-gray-900 text-white rounded-md text-sm font-medium disabled:opacity-50"
      >
        {submitting ? 'Adding…' : 'Add'}
      </button>
    </form>
  )
}

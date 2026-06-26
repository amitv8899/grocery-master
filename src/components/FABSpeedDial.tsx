'use client'

import { useState } from 'react'

type Props = {
  onManual: () => void
  onImportJSON: () => void
}

export default function FABSpeedDial({ onManual, onImportJSON }: Props) {
  const [open, setOpen] = useState(false)

  function toggle() {
    setOpen((prev) => !prev)
  }

  function handleManual() {
    setOpen(false)
    onManual()
  }

  function handleImportJSON() {
    setOpen(false)
    onImportJSON()
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[9]"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="fixed bottom-[88px] right-4 z-10 flex flex-col items-end gap-2">
        {open && (
          <>
            <div
              className={`flex items-center gap-2 transition-all duration-150 ease-out ${
                open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <span className="text-xs text-warm-text bg-warm-card px-2 py-1 rounded-lg shadow-sm whitespace-nowrap">
                ✎ Add manually
              </span>
              <button
                onClick={handleManual}
                aria-label="Add manually"
                className="w-11 h-11 rounded-full bg-warm-text text-white flex items-center justify-center text-base shadow-md"
              >
                ✎
              </button>
            </div>

            <div
              className={`flex items-center gap-2 transition-all duration-150 ease-out ${
                open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <span className="text-xs text-warm-text bg-warm-card px-2 py-1 rounded-lg shadow-sm whitespace-nowrap">
                {'{ } Import JSON'}
              </span>
              <button
                onClick={handleImportJSON}
                aria-label="Import JSON"
                className="w-11 h-11 rounded-full bg-warm-text text-white flex items-center justify-center text-base shadow-md"
              >
                {'{}'}
              </button>
            </div>
          </>
        )}

        <button
          onClick={toggle}
          aria-label={open ? 'Close menu' : 'Add recipe'}
          className="w-[54px] h-[54px] rounded-full bg-warm-text text-white flex items-center justify-center text-3xl shadow-lg"
        >
          +
        </button>
      </div>
    </>
  )
}

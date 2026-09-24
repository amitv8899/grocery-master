'use client'

import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, children }: Props) {
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Keep the sheet pinned to the visible (non-keyboard) portion of the
  // screen — on mobile, focusing an input shrinks the visual viewport
  // without shrinking the layout viewport, which is what pushes the
  // sheet's bottom (and its submit button) behind the keyboard.
  useEffect(() => {
    if (!open) return
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    if (!vv) return

    function updateViewport() {
      setViewport({ height: vv!.height, top: vv!.offsetTop })
    }
    updateViewport()
    vv.addEventListener('resize', updateViewport)
    vv.addEventListener('scroll', updateViewport)
    return () => {
      vv.removeEventListener('resize', updateViewport)
      vv.removeEventListener('scroll', updateViewport)
      setViewport(null)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-end overflow-hidden"
      style={viewport ? { top: viewport.top, height: viewport.height } : undefined}
      onClick={onClose}
    >
      <div
        className="w-full bg-warm-card rounded-t-2xl border-t border-warm-border px-4 pb-8 max-h-[85vh] overflow-y-auto"
        style={viewport ? { maxHeight: viewport.height } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-warm-muted rounded-full mx-auto mt-2.5 mb-4" />
        {children}
      </div>
    </div>
  )
}

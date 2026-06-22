'use client'

type Props = {
  labels: string[]
  activeLabel: string | null
  onChange: (label: string | null) => void
}

export default function LabelFilterBar({ labels, activeLabel, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      <button
        onClick={() => onChange(null)}
        className={`flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors ${
          activeLabel === null
            ? 'bg-warm-text text-white'
            : 'border border-warm-muted text-warm-sub bg-warm-card'
        }`}
      >
        All
      </button>
      {labels.map((label) => (
        <button
          key={label}
          onClick={() => onChange(label)}
          className={`flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors ${
            activeLabel === label
              ? 'bg-warm-text text-white'
              : 'border border-warm-muted text-warm-sub bg-warm-card'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

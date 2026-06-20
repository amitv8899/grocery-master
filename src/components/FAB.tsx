type Props = { onClick: () => void }

export default function FAB({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Add item"
      className="fixed bottom-[88px] right-4 w-[54px] h-[54px] rounded-full bg-warm-text text-white flex items-center justify-center text-3xl shadow-lg z-10"
    >
      +
    </button>
  )
}

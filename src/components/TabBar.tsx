import { IconList, IconToolsKitchen2 } from '@tabler/icons-react'

type Tab = 'list' | 'recipes'

type Props = {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export default function TabBar({ activeTab, onTabChange }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-warm-card border-t border-warm-border flex px-4 pt-2 pb-6 gap-2 z-10">
      <button
        onClick={() => onTabChange('list')}
        className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs font-medium transition-colors ${
          activeTab === 'list' ? 'bg-warm-text text-white' : 'text-warm-sub'
        }`}
      >
        <IconList size={16} />
        List
      </button>
      <button
        onClick={() => onTabChange('recipes')}
        className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs font-medium transition-colors ${
          activeTab === 'recipes' ? 'bg-warm-text text-white' : 'text-warm-sub'
        }`}
      >
        <IconToolsKitchen2 size={16} />
        Recipes
      </button>
    </div>
  )
}

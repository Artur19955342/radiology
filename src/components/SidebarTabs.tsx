export type SidebarTabId = 'passport' | 'findings' | 'ai'

type SidebarTabsProps = {
  activeTab: SidebarTabId
  onChange: (tab: SidebarTabId) => void
}

const tabs: Array<{ id: SidebarTabId; label: string }> = [
  { id: 'passport', label: 'Паспортная часть' },
  { id: 'findings', label: 'Находки' },
  { id: 'ai', label: 'ИИ' },
]

function SidebarTabs({ activeTab, onChange }: SidebarTabsProps) {
  return (
    <div className="sidebar-tabs" role="tablist" aria-label="Разделы боковой панели">
      {tabs.map((tab) => (
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={activeTab === tab.id ? 'active-sidebar-tab' : ''}
          key={tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default SidebarTabs

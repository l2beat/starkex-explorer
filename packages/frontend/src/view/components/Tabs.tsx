import React, { ReactNode } from 'react'

interface TabsProps {
  items: Tab[]
}

interface Tab {
  id: string
  name: string
  content: ReactNode
  icon?: ReactNode
  shortName?: string
}

export function Tabs({ items }: TabsProps) {
  return (
    <div className="Tabs">
      <div className="relative mb-6 border-b border-zinc-800">
        <div className="TabsItemsContainer grid auto-cols-fr grid-flow-col md:flex md:gap-x-2">
          {items.map((tab) => (
            <a
              className="TabsItem group relative flex items-center justify-center rounded-t-lg py-3 px-6 font-semibold transition-colors"
              key={tab.id}
              id={tab.id}
              href={`#${tab.id}`}
            >
              {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
              <span className="text-base hidden md:inline">{tab.name}</span>
              <span className="inline text-xs md:hidden">
                {tab.shortName ?? tab.name}
              </span>
              <span className="absolute bottom-0 left-0 block h-1 w-full rounded-t-sm bg-brand opacity-0 transition-all duration-300 group-hover:opacity-80" />
            </a>
          ))}
        </div>
        <span className="TabsUnderline absolute bottom-0 block h-1 rounded-t-sm bg-brand transition-all duration-300" />
      </div>
      {items.map((tab) => (
        <div className="TabsContent hidden" id={tab.id} key={tab.id}>
          {tab.content}
        </div>
      ))}
    </div>
  )
}

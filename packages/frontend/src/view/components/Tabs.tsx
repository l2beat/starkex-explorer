import React, { ReactNode } from 'react'

import { ChevronLeftIcon, ChevronRightIcon } from '../assets/icons/ChevronIcon'

interface TabsProps {
  items: Tab[]
}

interface Tab {
  id: string
  name: string
  content: ReactNode
  accessoryLeft?: ReactNode
  accessoryRight?: ReactNode
}

export function Tabs({ items }: TabsProps) {
  return (
    <div className="Tabs">
      <div className="relative mb-4 border-b border-zinc-800">
        <div className="TabsArrowLeft absolute inset-y-0 -left-1 z-10 hidden w-6 cursor-pointer bg-gradient-to-r from-neutral-900 via-neutral-900">
          <div className="flex h-full items-center justify-center text-white">
            <ChevronLeftIcon />
          </div>
        </div>
        <div className="TabsItemsContainer scrollbar-hide relative flex overflow-x-auto md:gap-x-2">
          {items.map((tab) => (
            <a
              className="TabsItem group relative flex items-center justify-center whitespace-nowrap rounded-t-lg px-4 py-3 font-semibold transition-colors"
              key={tab.id}
              id={tab.id}
              href={`#${tab.id}`}
            >
              {tab.accessoryLeft && (
                <span className="mr-2">{tab.accessoryLeft}</span>
              )}
              <span className="text-base">{tab.name}</span>
              {tab.accessoryRight && (
                <span className="ml-2">{tab.accessoryRight}</span>
              )}
              <span className="absolute bottom-0 left-0 block h-1 w-full rounded-t-sm bg-brand opacity-0 transition-all duration-300 group-hover:opacity-80" />
            </a>
          ))}
          <span className="TabsUnderline absolute bottom-0 block h-1 rounded-t-sm bg-brand transition-all duration-300" />
        </div>
        <div className="TabsArrowRight absolute inset-y-0 -right-1 z-10 hidden w-6 cursor-pointer bg-gradient-to-l from-neutral-900 via-neutral-900">
          <div className="flex h-full items-center justify-center">
            <ChevronRightIcon />
          </div>
        </div>
      </div>
      {items.map((tab) => (
        <div className="TabsContent hidden" id={tab.id} key={tab.id}>
          {tab.content}
        </div>
      ))}
    </div>
  )
}

import React from 'react'

import { SectionHeading } from '../../../components/SectionHeading'

export const DEFAULT_TUTORIALS: HomeTutorialEntry[] = [
  {
    title: 'Learn how to use StarkEx Explorer efficiently',
    imageUrl: '/images/tutorial.jpg',
    href: '/tutorials/features',
  },
  {
    title: 'All about forced transactions',
    imageUrl: '/images/tutorial.jpg',
    href: '/tutorials/forced-transactions',
  },
  {
    title: 'Stark key registration',
    imageUrl: '/images/tutorial.jpg',
    href: '/tutorials/registration',
  },
]

export interface HomeTutorialsProps {
  tutorials: HomeTutorialEntry[]
}

export interface HomeTutorialEntry {
  title: string
  imageUrl: string
  href: string
}

export function HomeTutorials(props: HomeTutorialsProps) {
  return (
    <section className="xl:mt-[72px]">
      <SectionHeading
        title="Tutorials"
        description="Learn how to use the StarkEx Explorer"
        leftAlign
      />
      <ul className="flex flex-col gap-4">
        {props.tutorials.map((tutorial, i) => (
          <li key={i}>
            <a href={tutorial.href} className="flex w-full items-center gap-4">
              <img className="h-20 w-[128px] rounded" src={tutorial.imageUrl} />
              <div className="flex-1">
                <p className="mb-1.5 text-lg font-semibold leading-tight">
                  {tutorial.title}
                </p>
                <p className="text-xs font-semibold text-blue-600 underline">
                  Read now
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

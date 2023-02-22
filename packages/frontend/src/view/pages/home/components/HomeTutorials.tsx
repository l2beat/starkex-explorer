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
            <a href={tutorial.href} className="flex w-full gap-4 items-center">
              <img className="w-[128px] h-20 rounded" src={tutorial.imageUrl} />
              <div className="flex-1">
                <p className="font-semibold text-lg leading-tight mb-1.5">
                  {tutorial.title}
                </p>
                <p className="text-blue-600 underline text-xs font-semibold">
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

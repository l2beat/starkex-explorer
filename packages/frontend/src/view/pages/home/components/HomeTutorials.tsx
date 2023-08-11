import classNames from 'classnames'
import React from 'react'

import { ArrowRightIcon } from '../../../assets/icons/ArrowIcon'
import { Card } from '../../../components/Card'
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

interface HomeTutorialsProps {
  className?: string
  tutorials: HomeTutorialEntry[]
}

export interface HomeTutorialEntry {
  title: string
  imageUrl: string
  href: string
}

export function HomeTutorials(props: HomeTutorialsProps) {
  return (
    <div className={classNames('flex flex-col', props.className)}>
      <SectionHeading
        title="Tutorials"
        description="Learn how to use the StarkEx Explorer"
      />
      <Card className="flex flex-grow flex-col gap-4">
        {props.tutorials.map((tutorial, i) => (
          <a
            key={i}
            href={tutorial.href}
            className="group flex w-full items-center gap-4"
          >
            <img
              className="h-[63px] w-[112px] rounded"
              src={tutorial.imageUrl}
            />
            <div className="flex-1">
              <p className="text-base font-semibold leading-tight">
                {tutorial.title}
              </p>
              <span className="flex items-center text-xs font-semibold text-brand group-hover:underline">
                Read now <ArrowRightIcon />
              </span>
            </div>
          </a>
        ))}
      </Card>
    </div>
  )
}

import classNames from 'classnames'
import React from 'react'

import { ArrowRightIcon } from '../../../assets/icons/ArrowIcon'
import { Card } from '../../../components/Card'
import { Link } from '../../../components/Link'
import { SectionHeading } from '../../../components/SectionHeading'

export interface HomeTutorialEntry {
  title: string
  imageUrl: string
  slug: string
}
interface HomeTutorialsProps {
  className?: string
  tutorials: HomeTutorialEntry[]
  showViewAll?: boolean
}

export function HomeTutorials(props: HomeTutorialsProps) {
  return (
    <div className={classNames('flex flex-col', props.className)}>
      <SectionHeading
        title="Tutorials"
        description={
          props.showViewAll ? (
            <Link href="/tutorials">View all</Link>
          ) : (
            'Learn how to use the StarkEx Explorer'
          )
        }
      />
      <Card className="flex h-min flex-col gap-4">
        {props.tutorials.map((tutorial, i) => (
          <a
            key={i}
            href={`/tutorials/${tutorial.slug}`}
            className="group flex w-full items-center gap-4"
          >
            <img
              className="aspect-video h-[63px] rounded"
              src={tutorial.imageUrl}
              data-fallback="/images/introduction.jpg"
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

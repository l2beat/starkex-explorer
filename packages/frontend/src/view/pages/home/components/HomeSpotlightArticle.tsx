import classNames from 'classnames'
import React from 'react'

import { HomeTutorialEntry } from '../../..'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'

interface HomeSpotlightArticleProps {
  spotlightArticle: HomeTutorialEntry
  className?: string
}

export function HomeSpotlightArticle(props: HomeSpotlightArticleProps) {
  return (
    <Card className={classNames('grid grid-cols-2 gap-x-20', props.className)}>
      <div className="flex flex-col justify-center gap-4 pl-6">
        <span className="text-sm text-zinc-500">Spotlight article</span>
        <span className="text-xxl">{props.spotlightArticle.title}</span>
        <Button
          as="a"
          href={`/tutorials/${props.spotlightArticle.slug}`}
          variant="outlined"
          className="w-36"
        >
          Read now
        </Button>
      </div>
      <img
        src={props.spotlightArticle.imageUrl}
        data-fallback="/images/tutorial.jpg"
      />
    </Card>
  )
}

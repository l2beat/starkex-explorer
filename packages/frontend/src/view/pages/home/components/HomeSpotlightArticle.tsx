import classNames from 'classnames'
import React from 'react'

import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { HomeTutorialEntry } from './HomeTutorials'

interface HomeSpotlightArticleProps {
  spotlightArticle: Omit<HomeTutorialEntry, 'imageUrl'>
  className?: string
}

export function HomeSpotlightArticle(props: HomeSpotlightArticleProps) {
  return (
    <Card className={classNames('grid grid-cols-2', props.className)}>
      <div className="flex flex-col justify-center gap-4 pl-6">
        <span className="text-sm text-zinc-500">Spotlight article</span>
        <span className="text-xxl">{props.spotlightArticle.title}</span>
        <Button
          as="a"
          href={props.spotlightArticle.href}
          variant="outlined"
          className="w-36"
        >
          Read now
        </Button>
      </div>
      <img src="/images/spotlight-article.png" />
    </Card>
  )
}

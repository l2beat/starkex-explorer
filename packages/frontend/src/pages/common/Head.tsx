import React from 'react'

import { Favicons } from './Favicons'
import { MetaTags } from './MetaTags'

export interface HeadProps {
  title: string
  description: string
  image: string
  url: string
}

export function Head(props: HeadProps) {
  return (
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="/styles/main.css" />
      <Favicons />
      <MetaTags
        title={props.title}
        description={props.description}
        image={props.image}
        url={props.url}
      />
    </head>
  )
}

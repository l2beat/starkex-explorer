import React from 'react'

import { reactToHtml } from '../reactToHtml'

export interface HomePageProps {
  title: string
}

export function renderHomePage(props: HomePageProps) {
  return reactToHtml(<HomePage {...props} />)
}

function HomePage(props: HomePageProps) {
  return (
    <div>
      <h1>Home Page: {props.title}</h1>
    </div>
  )
}

import cx from 'classnames'
import React from 'react'

import { Link } from '../components/Link'
import { reactToHtml } from '../reactToHtml'

export interface DevPageProps {
  routes: {
    path: string
    description: string
    breakAfter?: boolean
  }[]
}

export function renderDevPage(props: DevPageProps) {
  return reactToHtml(<DevPage {...props} />)
}

function DevPage(props: DevPageProps) {
  return (
    <html lang="en" className="h-full bg-neutral-900 text-white">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/styles/main.css" />
      </head>
      <body className="p-4">
        <ul>
          {props.routes.map((route, i) => (
            <li key={i} className={cx(route.breakAfter && 'mb-4')}>
              <Link href={route.path}>{route.path}</Link>{' '}
              <small className="text-sm">{route.description}</small>
            </li>
          ))}
        </ul>
      </body>
    </html>
  )
}

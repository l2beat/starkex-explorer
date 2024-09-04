import { PageContext, PageContextWithUser } from '@explorer/shared'
import React, { ReactNode } from 'react'

import { Tooltip } from '../Tooltip'
import { BreakpointIndicator } from './BreakpointIndicator'
import { Footer } from './Footer'
import { FreezeBanner } from './FreezeBanner'
import { Head } from './Head'
import { Navbar } from './Navbar'

interface Props {
  context: PageContext | PageContextWithUser
  withoutSearch?: boolean
  description: string
  image?: string
  baseTitle?: string
  title?: string
  baseUrl?: string
  path: string
  scripts?: string[]
  stylesheets?: string[]
  children: ReactNode
}

export function Page(props: Props) {
  const isDebug = process.env.DEBUG === 'true'
  const isPreview = process.env.DEPLOYMENT_ENV === 'preview'
  return (
    <html
      lang="en"
      className="h-full bg-neutral-900 text-white"
      data-chain-id={props.context.chainId}
    >
      <Head
        description={props.description}
        image={props.image ?? '/images/meta-image.png'}
        title={combineTitle(
          props.baseTitle ?? `L2BEAT ${props.context.instanceName} Explorer`,
          props.title
        )}
        url={combineUrl(
          props.baseUrl ??
            `https://${props.context.instanceName.toLowerCase()}.l2beat.com`,
          props.path
        )}
        stylesheets={
          props.stylesheets ?? [
            '/styles/main.css',
            ...(isDebug && isPreview ? ['/styles/debug.css'] : []),
          ]
        }
      />
      <body className="flex h-full flex-col">
        {isPreview && <BreakpointIndicator />}
        <Navbar
          showSearchBar={!props.withoutSearch}
          context={props.context}
          path={props.path}
          isPreview={isPreview}
        />
        <FreezeBanner freezeStatus={props.context.freezeStatus} />
        <GradientBackground />
        {props.children}
        <Footer />
        <Tooltip />
        {(props.scripts ?? ['/scripts/main.js']).map((src, i) => (
          <script key={i} src={src} />
        ))}
      </body>
    </html>
  )
}

function GradientBackground() {
  return (
    <div className="relative">
      <div className="absolute top-0 -z-50 h-96 w-full bg-gradient-to-b from-[#262646] via-transparent "></div>
    </div>
  )
}

function combineTitle(baseTitle: string, title: string | undefined) {
  if (!title) {
    return baseTitle
  } else {
    return `${title} | ${baseTitle}`
  }
}

function combineUrl(baseUrl: string, path: string) {
  if (path === '' || path === '/') {
    return baseUrl
  }
  if (path.startsWith('/')) {
    return `${baseUrl}${path}`
  } else {
    return `${baseUrl}/${path}`
  }
}

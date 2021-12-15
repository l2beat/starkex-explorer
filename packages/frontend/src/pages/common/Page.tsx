import React, { ReactNode } from 'react'
import { Head, HeadProps } from './Head'

interface Props extends HeadProps {
  children: ReactNode
}

export function Page({ children, ...head }: Props) {
  return (
    <html lang="en">
      <Head {...head} />
      <body>
        <div className="Page">{children}</div>
        <script src="/scripts/main.js" />
      </body>
    </html>
  )
}

import React, { ReactNode } from 'react'
import { Head, HeadProps } from './Head'

interface Props extends HeadProps {
  scripts: string[]
  children: ReactNode
}

export function Page({ children, scripts, ...head }: Props) {
  return (
    <html lang="en" className="text-[16px] font-sans font-regular bg-zinc-50">
      <Head {...head} />
      <body>
        <div className="Page">{children}</div>
        {scripts.map((src, i) => (
          <script key={i} src={src} />
        ))}
      </body>
    </html>
  )
}

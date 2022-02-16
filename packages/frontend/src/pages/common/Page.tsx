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
        <div className="flex justify-center items-center top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 absolute pointer-events-none text-[10vw] font-bold opacity-5 -rotate-45 select-none">
          PREVIEW
        </div>
        <div className="Page">{children}</div>
        {scripts.map((src, i) => (
          <script key={i} src={src} />
        ))}
      </body>
    </html>
  )
}

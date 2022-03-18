import React, { ReactNode } from 'react'
import { Footer } from './Footer'
import { Head, HeadProps } from './Head'
import { Navbar } from './Navbar'

interface Props extends HeadProps {
  scripts: string[]
  children: ReactNode
  withoutSearch?: boolean
}

export function Page({ children, scripts, withoutSearch, ...head }: Props) {
  return (
    <html
      lang="en"
      className="text-[16px] font-sans font-regular bg-grey-100 text-white"
    >
      <Head {...head} />
      <body>
        <div className="flex justify-center items-center top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 absolute pointer-events-none text-[10vw] font-bold opacity-5 -rotate-45 select-none">
          PREVIEW
        </div>
        <div className="Page">
          <Navbar searchBar={!withoutSearch} />
          <main className="px-4 max-w-[900px] mx-auto pt-20">
            {children}
            <Footer />
          </main>
        </div>
        {scripts.map((src, i) => (
          <script key={i} src={src} />
        ))}
      </body>
    </html>
  )
}

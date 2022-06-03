import React, { ReactNode } from 'react'

import { AccountDetails } from './AccountDetails'
import { Footer } from './Footer'
import { Head, HeadProps } from './Head'
import { Navbar } from './Navbar'

interface Props extends HeadProps {
  account: AccountDetails | undefined
  scripts: string[]
  children: ReactNode
  withoutSearch?: boolean
}

export function Page({
  account,
  children,
  scripts,
  withoutSearch,
  ...head
}: Props) {
  return (
    <html
      lang="en"
      className="text-[16px] font-sans font-regular bg-grey-100 text-white"
    >
      <Head {...head} />
      <body>
        <div className="Page">
          <Navbar searchBar={!withoutSearch} account={account} />
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

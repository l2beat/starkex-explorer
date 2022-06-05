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
    <html lang="en" className="bg-grey-100 text-white">
      <Head {...head} />
      <body>
        <Navbar searchBar={!withoutSearch} account={account} />
        <main className="px-2 wide:px-4 max-w-[900px] mx-auto pt-8 wide:pt-20 pb-20">
          {children}
        </main>
        <Footer />
        {scripts.map((src, i) => (
          <script key={i} src={src} />
        ))}
      </body>
    </html>
  )
}

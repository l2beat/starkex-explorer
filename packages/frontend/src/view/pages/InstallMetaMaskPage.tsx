import { PageContext } from '@explorer/shared'
import React from 'react'

import { Card } from '../components/Card'
import { Link } from '../components/Link'
import { ContentWrapper } from '../components/page/ContentWrapper'
import { Page } from '../components/page/Page'
import { reactToHtml } from '../reactToHtml'

interface Props {
  context: PageContext
}

function InstallMetaMaskPage(props: Props) {
  return (
    <Page
      path="/metamask-required"
      description="Install MetaMask"
      context={props.context}
    >
      <ContentWrapper className="grid auto-rows-min grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-3">
          <div className="hidden text-xxl font-semibold lg:block">
            Please install MetaMask
          </div>
          <span className="font-medium text-zinc-500 lg:mt-3">
            To perform actions that require interaction with Ethereum blockchain
            you need to install MetaMask (or compatible) wallet.
          </span>
          {props.context.freezeStatus === 'frozen' && (
            <span className="font-medium text-zinc-500">
              Even if you haven't used MetaMask to create your account on the
              exchange, you can trigger Escape Hatch operations for your
              positions using a different Ethereum account. See our{' '}
              <Link href="/faqescapehatch">FAQ</Link> for more details.
            </span>
          )}
        </div>
        <Card className="row-start-1 h-min lg:col-start-2">
          <div className="flex flex-col items-center gap-2">
            <img src="https://images.ctfassets.net/9sy2a0egs6zh/2qy1wS5MmZOXkXn9yFlGJp/f3797a512c283e6f71450abd408b7452/mm-logo-white.svg" />
            <Link href="https://metamask.io/">Install MetaMask</Link>
          </div>
        </Card>
      </ContentWrapper>
    </Page>
  )
}

export function renderInstallMetaMaskPage(props: Props) {
  return reactToHtml(<InstallMetaMaskPage {...props} />)
}

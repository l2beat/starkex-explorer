import { PageContext } from '@explorer/shared'
import React from 'react'

import { Button } from '../components/Button'
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
      <ContentWrapper className='flex flex-col gap-8 md:gap-16'>
        <div className="flex flex-col gap-3">
          <div className="text-xxl font-semibold">
            Please install MetaMask
          </div>
          <span className="font-medium text-zinc-500 mt-3">
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
        <Card >
          <div className="flex items-center md:flex-row flex-col md:justify-between gap-4">
            <img src="https://images.ctfassets.net/9sy2a0egs6zh/2qy1wS5MmZOXkXn9yFlGJp/f3797a512c283e6f71450abd408b7452/mm-logo-white.svg" className='h-14' />
            <Button as='a' href="https://metamask.io/" className='h-14 max-md:w-full w-[300px] !text-lg'>
              Install
            </Button>
          </div>
        </Card>
      </ContentWrapper>
    </Page>
  )
}

export function renderInstallMetaMaskPage(props: Props) {
  return reactToHtml(<InstallMetaMaskPage {...props} />)
}

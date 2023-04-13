import { PageContextWithUserAndStarkKey } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import React from 'react'

import { InfoIcon } from '../../assets/icons/InfoIcon'
import { WarningIcon } from '../../assets/icons/WarningIcon'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { InlineEllipsis } from '../../components/InlineEllipsis'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'

export const REGISTER_STARK_KEY_BUTTON_ID = 'register-stark-key-button'

interface UserRegisterPageProps {
  context: PageContextWithUserAndStarkKey
  exchangeAddress: EthereumAddress
}

function UserRegisterPage(props: UserRegisterPageProps) {
  return (
    <Page
      context={props.context}
      description="Register your stark key to your ethereum address"
      path="/users/register"
    >
      <ContentWrapper className="flex gap-12">
        <div className="flex-1">
          <div className="text-xxl font-semibold">Register Stark key</div>
          <div className="mt-6 flex flex-col gap-6 text-md font-medium leading-5 text-zinc-500">
            <span>
              You have connected your wallet and recovered the stark key but our
              system doesn't see any registered account for this address. There
              is no need for doing anything, registering your stark key is only
              needed when you want to perform forced actions.
            </span>
            <span>
              Registering means that your stark key will be linked to your
              ethereum address on L1. However the cost is very high so do not do
              this if you don't need to.
            </span>
          </div>
        </div>
        <Card className="h-min max-w-lg flex-1">
          <p className="text-sm font-semibold text-zinc-500">
            Ethereum address
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center">
              <WarningIcon />
              <p className="text-base ml-2 font-semibold text-amber-500">
                Unknown
              </p>
            </div>
            <Button
              id={REGISTER_STARK_KEY_BUTTON_ID}
              data-exchange-address={props.exchangeAddress.toString()}
            >
              Register
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-center rounded bg-blue-400 bg-opacity-20 py-2">
            <InfoIcon />
            <p className="ml-2 text-sm font-medium text-white">
              Register your Stark key
            </p>
          </div>
          <p className="mt-6 text-sm font-semibold text-zinc-500">Stark key</p>
          <InlineEllipsis className="mt-1 max-w-[70%] font-semibold text-white">
            {props.context.user.starkKey.toString()}
          </InlineEllipsis>
        </Card>
      </ContentWrapper>
    </Page>
  )
}

export function renderUserRegisterPage(props: UserRegisterPageProps) {
  return reactToHtml(<UserRegisterPage {...props} />)
}

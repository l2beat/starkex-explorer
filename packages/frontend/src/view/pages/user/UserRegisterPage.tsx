import { PageContextWithUserAndStarkKey } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import React from 'react'

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
          <div className="text-xxl font-semibold">
            Register your Ethereum address
          </div>
          <div className="mt-6 flex flex-col gap-6 text-md font-medium leading-5 text-zinc-500">
            <span>
              Our system doesn't recognize any Ethereum address registered to
              your Stark key.
            </span>
            <span>
              This registration is needed to perform forced operations. However,
              <strong>
                the cost of registration is very high, and so is not recommended
                if not absolutely necessary.
              </strong>
            </span>
          </div>
        </div>
        <Card className="h-min max-w-lg flex-1">
          <p className="text-sm font-semibold text-zinc-500">
            Ethereum address
          </p>
          <div className="mt-3 flex items-center justify-between">
            <InlineEllipsis className="max-w-[200px] font-semibold">
              {props.context.user.address.toString()}
            </InlineEllipsis>
            <Button
              id={REGISTER_STARK_KEY_BUTTON_ID}
              data-exchange-address={props.exchangeAddress.toString()}
            >
              Register
            </Button>
          </div>
          <p className="mt-6 text-sm font-semibold text-zinc-500">Stark key</p>
          <InlineEllipsis className="mt-1 max-w-[450px] font-semibold text-white">
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

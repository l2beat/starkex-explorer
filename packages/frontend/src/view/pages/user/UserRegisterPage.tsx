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
      <ContentWrapper className="grid auto-rows-min grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-12">
        <div className="text-xxl font-semibold lg:hidden">
          Register your Ethereum address
        </div>
        <div>
          <div className="hidden text-xxl font-semibold lg:block">
            Register your Ethereum address
          </div>
          <div className="flex flex-col gap-6 text-md font-medium leading-5 text-zinc-500 lg:mt-6">
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
        <Card className="row-start-2 h-min lg:col-start-2 lg:row-start-1">
          <p className="mt-3 text-sm font-semibold text-zinc-500">Stark key</p>
          <InlineEllipsis className="mt-1 w-full max-w-[250px] font-semibold text-white sm:max-w-[80%] md:max-w-[100%] lg:max-w-[50%] ">
            {props.context.user.starkKey.toString()}
          </InlineEllipsis>
          <p className="mt-6 text-sm font-semibold text-zinc-500">
            Ethereum address
          </p>
          <div className="mt-3 flex items-center justify-between">
            <InlineEllipsis className="max-w-[120px] font-semibold sm:max-w-full lg:max-w-[250px]">
              {props.context.user.address.toString()}
            </InlineEllipsis>
          </div>
          <Button
            className="mt-3 w-full"
            id={REGISTER_STARK_KEY_BUTTON_ID}
            data-exchange-address={props.exchangeAddress.toString()}
          >
            Register your Ethereum address
          </Button>
        </Card>
      </ContentWrapper>
    </Page>
  )
}

export function renderUserRegisterPage(props: UserRegisterPageProps) {
  return reactToHtml(<UserRegisterPage {...props} />)
}

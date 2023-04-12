import { PageContextWithUserAndStarkKey } from '@explorer/shared'
import React from 'react'

import { EthereumAddress } from '@explorer/types'
import { InfoIcon } from '../../assets/icons/InfoIcon'
import { WarningIcon } from '../../assets/icons/WarningIcon'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { InlineEllipsis } from '../../components/InlineEllipsis'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'

export const REGISTER_ETHEREUM_ADDRESS_BUTTON_ID =
  'register-ethereum-address-button'

interface UserRegisterPageProps {
  context: PageContextWithUserAndStarkKey
  exchangeAddress: EthereumAddress
}

function UserRegisterPage(props: UserRegisterPageProps) {
  return (
    <Page
      context={props.context}
      description="TODO: description"
      path="/users/register"
    >
      <ContentWrapper className="flex gap-12">
        <div className="flex-1">
          <div className="text-xxl font-semibold">Register Stark key</div>
          <div className="mt-6 flex flex-col gap-6 text-md font-medium leading-5 text-zinc-500">
            <span>
              Aute ad culpa eiusmod et anim adipisicing non consectetur amet
              aliqua. Magna reprehenderit do laboris labore cupidatat sint. Non
              ullamco ut consectetur aute deserunt. Sunt aute pariatur tempor
              sit velit excepteur consectetur id mollit adipisicing enim
              excepteur.
            </span>
            <span>
              Cupidatat laborum excepteur enim irure. Culpa aliquip consequat
              dolore laboris ullamco cupidatat velit exercitation non laboris
              magna in. Excepteur minim consectetur proident deserunt
              exercitation aute irure cillum ex incididunt. Ad velit proident
              aliquip cupidatat sint proident incididunt ex. Pariatur do elit
              nostrud voluptate aliqua duis sunt Lorem fugiat ipsum officia
              minim dolore.
            </span>
            <span>
              Velit enim enim mollit labore. Fugiat tempor enim occaecat
              incididunt consequat esse aliquip mollit consequat. Consectetur
              adipisicing adipisicing consequat irure est sint reprehenderit
              irure.
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
              id={REGISTER_ETHEREUM_ADDRESS_BUTTON_ID}
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

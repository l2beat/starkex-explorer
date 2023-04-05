import { UserDetails } from '@explorer/shared'
import React from 'react'

import { getInstanceName } from '../../../utils/instance'
import { InfoIcon } from '../../assets/icons/InfoIcon'
import { WarningIcon } from '../../assets/icons/WarningIcon'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { InlineEllipsis } from '../../components/InlineEllipsis'
import { Link } from '../../components/Link'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'

export const REGISTER_STARK_KEY_BUTTON_ID = 'register-stark-key-button'

interface UserRegisterPageProps {
  user: UserDetails
}

function UserRegisterPage(props: UserRegisterPageProps) {
  return (
    <Page
      user={props.user}
      description="TODO: description"
      path="/users/register"
    >
      <ContentWrapper className="flex gap-12">
        <div className="flex-1">
          <div className="text-xxl font-semibold">Register Stark key</div>
          <div className="mt-6 flex flex-col gap-6 text-md font-medium leading-5 text-zinc-500">
            <span>
              You have connected your wallet, but our system doesn't see any
              registered account for this address. This is because StarkEx
              systems use Stark keys and not Ethereum addresses as user ids. If
              you are a user of this system please register your Ethereum
              address with your Stark key.
            </span>
            <span>
              Registering requires you to sign a message with your stark private
              key. To obtain the key we will ask you to sign a message with
              metamask. CAUTION This operation can be dangerous if done on a
              malicious website. Make sure you trust this website (you can read
              the code{' '}
              <Link href="https://github.com/l2beat/starkex-explorer">
                here
              </Link>
              ). Metamask will say that the message should only be signed on
              DOMAIN, but you can make an exception for this explorer.
            </span>
            {/* TODO: Add link to DOMAIN */}
            <span>
              As an alternative to registration you can try to figure out your
              stark key yourself. Then just paste it into the search bar. You
              will however be unable to submit forced transactions without
              registering.
            </span>
          </div>
        </div>
        <Card className="h-min flex-1">
          <p className="text-sm font-semibold text-zinc-500">Stark key</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center">
              <WarningIcon />
              <p className="text-base ml-2 font-semibold text-amber-500">
                Unknown
              </p>
            </div>
            <Button
              id={REGISTER_STARK_KEY_BUTTON_ID}
              data-instance-name={getInstanceName()}
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
          <p className="mt-6 text-sm font-semibold text-zinc-500 ">
            Ethereum address
          </p>
          <InlineEllipsis className="mt-1 w-full max-w-[99%] font-semibold text-white ">
            {props.user.address.toString()}
          </InlineEllipsis>
        </Card>
      </ContentWrapper>
    </Page>
  )
}

export function renderUserRegisterPage(props: UserRegisterPageProps) {
  return reactToHtml(<UserRegisterPage {...props} />)
}

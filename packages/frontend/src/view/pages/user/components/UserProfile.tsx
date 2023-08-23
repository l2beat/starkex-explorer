import { UserDetails } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { EtherscanLink } from '../../../components/EtherscanLink'
import { InfoBanner } from '../../../components/InfoBanner'
import { LongHash } from '../../../components/LongHash'

interface UserProfileProps {
  user: Partial<UserDetails> | undefined
  starkKey: StarkKey
  chainId: number
  ethereumAddress?: EthereumAddress
}

export function UserProfile({
  user,
  starkKey,
  chainId,
  ethereumAddress,
}: UserProfileProps) {
  const isMine = user?.starkKey === starkKey
  return (
    <Card>
      <p className="text-sm font-semibold text-zinc-500">Stark key</p>
      <LongHash className="mt-3 font-semibold text-white" withCopy>
        {starkKey.toString()}
      </LongHash>
      <p className="mt-6 text-sm font-semibold text-zinc-500 ">
        Ethereum address
      </p>
      {ethereumAddress ? (
        <EtherscanLink
          chainId={chainId}
          type="address"
          address={ethereumAddress.toString()}
          className="break-all font-semibold"
        >
          {ethereumAddress.toString()}
        </EtherscanLink>
      ) : (
        <>
          <div className="mt-3 md:flex md:items-center md:justify-between">
            {user?.address && isMine ? (
              <LongHash withCopy>{user.address.toString()}</LongHash>
            ) : (
              'Unknown'
            )}
            {isMine && (
              <Button
                as="a"
                href="/users/register"
                className="mt-3 block md:mt-0"
              >
                Register
              </Button>
            )}
          </div>
          {isMine && (
            <InfoBanner className="mt-5">
              Your Ethereum address is not registered to your Stark key
              (unnecessary unless you want to perform forced operations)
            </InfoBanner>
          )}
        </>
      )}
    </Card>
  )
}

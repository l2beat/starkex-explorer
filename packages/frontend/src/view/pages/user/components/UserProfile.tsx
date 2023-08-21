import { UserDetails } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { Button } from '../../../components/Button'
import { InfoBanner } from '../../../components/InfoBanner'
import { LongHash } from '../../../components/LongHash'

interface UserProfileProps {
  user: Partial<UserDetails> | undefined
  starkKey: StarkKey
  ethereumAddress?: EthereumAddress
}

export function UserProfile({
  user,
  starkKey,
  ethereumAddress,
}: UserProfileProps) {
  const isMine = user?.starkKey === starkKey
  return (
    <section className="flex  flex-col rounded-lg bg-gray-800 p-6">
      <p className="text-sm font-semibold text-zinc-500">Stark key</p>
      <LongHash className="mt-3 font-semibold text-white" withCopy>
        {starkKey.toString()}
      </LongHash>
      <p className="mt-6 text-sm font-semibold text-zinc-500 ">
        Ethereum address
      </p>
      {ethereumAddress ? (
        <LongHash className="mt-3 font-semibold text-white" withCopy>
          {ethereumAddress.toString()}
        </LongHash>
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
    </section>
  )
}

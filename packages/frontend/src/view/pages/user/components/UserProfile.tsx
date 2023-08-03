import { UserDetails } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { Button } from '../../../components/Button'
import { InfoBanner } from '../../../components/InfoBanner'

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
    <section className="flex w-full flex-col rounded-lg bg-gray-800 p-6">
      <p className="text-sm font-semibold text-zinc-500">Stark key</p>
      <p className="mt-3 font-semibold text-white">{starkKey.toString()}</p>
      <p className="mt-6 text-sm font-semibold text-zinc-500 ">
        Ethereum address
      </p>
      {ethereumAddress ? (
        <p className="mt-3 font-semibold text-white ">
          {ethereumAddress.toString()}
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between">
            <p className="font-semibold">
              {user?.address && isMine ? user.address.toString() : 'Unknown'}
            </p>
            {isMine && (
              <Button as="a" href="/users/register">
                Register
              </Button>
            )}
          </div>
          {isMine && (
            <InfoBanner className="mt-5">
              Your stark key is not linked to your ethereum address. You don't
              need this unless you want to perform forced actions.
            </InfoBanner>
          )}
        </>
      )}
    </section>
  )
}

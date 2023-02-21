import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { Button } from '../../../components/Button'
import { InfoIcon } from '../../../components/icons/InfoIcon'
import { WarningIcon } from '../../../components/icons/WarningIcon'

interface UserProfileProps {
  ethereumAddress?: EthereumAddress
  starkKey?: StarkKey
  isMine?: boolean
}

export function UserProfile({
  ethereumAddress,
  starkKey,
  isMine,
}: UserProfileProps) {
  return (
    <div className="mb-6 flex w-full flex-col rounded-lg bg-gray-800 p-6">
      <p className="text-sm font-semibold text-zinc-500">Ethereum address</p>
      {ethereumAddress ? (
        <p className="text-base mt-3 font-semibold text-white">
          {ethereumAddress.toString()}
        </p>
      ) : (
        <div className="mt-3 flex items-center">
          <WarningIcon />
          <p className="text-base ml-2 font-semibold text-amber-500">UNKNOWN</p>
        </div>
      )}
      <p className="mt-6 text-sm font-semibold text-zinc-500">Stark key</p>
      {starkKey ? (
        <p className="text-base mt-3 font-semibold text-white">
          {starkKey.toString()}
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center">
              <WarningIcon />
              <p className="text-base ml-2 font-semibold text-amber-500">
                UNKNOWN
              </p>
            </div>
            {isMine && <Button>Register</Button>}
          </div>
          {isMine && (
            <div className="mt-5 flex items-center justify-center rounded bg-blue-50 py-2">
              <InfoIcon />
              <p className="ml-2 text-sm font-medium text-white">
                Register your Stark key by proceeding with our step-by-sep
                instructions.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

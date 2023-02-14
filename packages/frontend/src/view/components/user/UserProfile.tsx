import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { InfoIcon } from '../../components/common/icons/InfoIcon'
import { WarningIcon } from '../../components/common/icons/WarningIcon'
import { Button } from '../common/Button'

interface UserProfileProps {
  ethereumAddress?: EthereumAddress
  starkKey?: StarkKey
}

export function UserProfile({ ethereumAddress, starkKey }: UserProfileProps) {
  return (
    <div className="mb-6 flex w-full flex-col rounded-lg bg-gray-800 p-6">
      <p className="text-sm font-semibold text-zinc-500">Ethereum address</p>
      <p className="mt-3 text-base font-semibold text-white">
        {ethereumAddress?.toString()}
      </p>
      <p className="mt-6 text-sm font-semibold text-zinc-500">Stark key</p>
      {starkKey ? (
        <p className="mt-3 text-base font-semibold text-white">
          {starkKey.toString()}
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center">
              <WarningIcon />
              <p className="ml-2 text-base font-semibold text-amber-500">
                UNKNOWN
              </p>
            </div>
            <Button>Register</Button>
          </div>
          <div className="mt-5 flex items-center justify-center rounded bg-blue-50 py-2">
            <InfoIcon />
            <p className="ml-2 text-sm font-medium text-white">
              Register your Stark key by proceeding with our step-by-sep
              instructions.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { Button } from '../common/Button'
import { InfoIcon } from '../common/icons/InfoIcon'
import { WarningIcon } from '../common/icons/WarningIcon'

interface UserProfileProps {
  ethereumAddress?: EthereumAddress
  starkKey?: StarkKey
}

export function UserProfile({ ethereumAddress, starkKey }: UserProfileProps) {
  return (
    <div className="bg-blue-900 p-6 flex flex-col w-full rounded-lg mb-6">
      <p className="font-semibold text-sm text-grey-500">Ethereum address</p>
      <p className="mt-3 text-white font-semibold text-base">
        {ethereumAddress?.toString()}
      </p>
      <p className="mt-6 font-semibold text-sm text-grey-500">Stark key</p>
      {starkKey ? (
        <p className="mt-3 text-white font-semibold text-base">
          {starkKey.toString()}
        </p>
      ) : (
        <>
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center">
              <WarningIcon />
              <p className="font-semibold text-base text-orange-300 ml-2">
                UNKNOWN
              </p>
            </div>
            <Button variant="ACTION">Register</Button>
          </div>
          <div className="flex items-center justify-center mt-5 bg-blue-50 rounded py-2">
            <InfoIcon />
            <p className="text-white font-medium text-sm ml-2">
              Register your Stark key by proceeding with our step-by-sep
              instructions.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

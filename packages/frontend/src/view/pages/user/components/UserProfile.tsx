import { CollateralAsset, UserDetails } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { assetToInfo } from '../../../../utils/assets'
import { formatWithDecimals } from '../../../../utils/formatting/formatAmount'
import { InfoIcon } from '../../../assets/icons/InfoIcon'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { Button } from '../../../components/Button'
import { Card } from '../../../components/Card'
import { EtherscanLink } from '../../../components/EtherscanLink'
import { InfoBanner } from '../../../components/InfoBanner'
import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { LongHash } from '../../../components/LongHash'
import { TooltipWrapper } from '../../../components/Tooltip'

interface UserProfileProps {
  user: Partial<UserDetails> | undefined
  starkKey: StarkKey
  chainId: number
  collateralAsset: CollateralAsset | undefined
  positionValue: bigint | undefined
  ethereumAddress?: EthereumAddress
}

export function UserProfile({
  user,
  starkKey,
  chainId,
  ethereumAddress,
  positionValue,
  collateralAsset,
}: UserProfileProps) {
  const isMine = user?.starkKey === starkKey
  return (
    <Card>
      <p className="mb-1.5 text-sm font-semibold text-zinc-500">Stark key</p>
      <LongHash className="font-semibold text-white" withCopy>
        {starkKey.toString()}
      </LongHash>
      <p className="mb-1.5 mt-6 text-sm font-semibold text-zinc-500 ">
        Ethereum address
      </p>
      {ethereumAddress ? (
        <EtherscanLink
          chainId={chainId}
          type="address"
          address={ethereumAddress.toString()}
          className="break-all font-semibold"
        >
          <InlineEllipsis className="max-w-[250px] sm:max-w-full">
            {ethereumAddress.toString()}
          </InlineEllipsis>
        </EtherscanLink>
      ) : (
        <>
          <div className="md:flex md:items-center md:justify-between">
            {user?.address && isMine ? (
              <EtherscanLink
                chainId={chainId}
                type="address"
                address={user.address.toString()}
                className="break-all font-semibold"
              >
                <InlineEllipsis className="max-w-[250px] sm:max-w-full">
                  {user.address.toString()}
                </InlineEllipsis>
              </EtherscanLink>
            ) : (
              'Unknown'
            )}
            {isMine && (
              <Button
                as="a"
                href="/users/register"
                className="mt-3 block md:mt-0"
                size="sm"
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
      {positionValue && collateralAsset ? (
        <>
          <p className="mb-1.5 mt-6 flex items-center gap-0.5 text-sm font-semibold text-zinc-500">
            Estimated position value{' '}
            <TooltipWrapper content="Exact value of the withdrawal will be calculated by the StarkEx smart contracts">
              <InfoIcon className="scale-75" />
            </TooltipWrapper>
          </p>
          <div className="flex items-center gap-2 font-semibold text-white">
            {formatWithDecimals(positionValue, 2)}{' '}
            <AssetWithLogo
              assetInfo={assetToInfo({ hashOrId: collateralAsset.assetId })}
              type="small"
            />
          </div>
        </>
      ) : null}
    </Card>
  )
}

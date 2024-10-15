import { CollateralAsset, InstanceName } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { ArrowDownIcon } from '../../../assets/icons/ArrowIcon'
import { Button } from '../../../components/Button'
import { TermsOfServiceAck } from '../../../components/TermsOfServiceAck'
import { NewForcedActionFormAsset } from '../NewForcedActionFormProps'
import { ForcedActionCard } from './ForcedActionCard'
import { AmountInput } from './form/AmountInput'
import { FormId } from './form/ids'
import { PriceInput } from './form/PriceInput'
import { TotalInput } from './form/TotalInput'

interface NewPerpetualForcedTradeFormContentProps {
  positionOrVaultId: bigint
  starkKey: StarkKey
  asset: NewForcedActionFormAsset
  collateralAsset: CollateralAsset
  instanceName: InstanceName
}

export function NewPerpetualForcedTradeFormContent(
  props: NewPerpetualForcedTradeFormContentProps
) {
  const isBuying = props.asset.balance < 0
  const label = isBuying ? 'buy' : 'sell'
  return (
    <>
      <div className="flex items-end justify-between">
        <span className="text-xl font-semibold">Forced {label} offer</span>
        <span>
          <span className="text-sm font-medium text-zinc-500">Position</span>{' '}
          <span className="text-lg font-semibold">
            #{props.positionOrVaultId.toString()}
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <ForcedActionCard>
          <AmountInput asset={props.asset} />
        </ForcedActionCard>
        <ForcedActionCard>
          <PriceInput
            asset={props.asset}
            collateralAsset={props.collateralAsset}
          />
        </ForcedActionCard>
        <div className="flex items-center justify-center">
          <ArrowDownIcon className="rounded bg-slate-800 text-zinc-500" />
        </div>
        <ForcedActionCard>
          <TotalInput assetId={props.collateralAsset.assetId} />
        </ForcedActionCard>
      </div>
      <TermsOfServiceAck
        prefix="By initiating this action you agree to our"
        instanceName={props.instanceName}
      />
      <div className="flex flex-col gap-2">
        <Button className="w-full" size="lg" id={FormId.SubmitButton}>
          Create {label} offer
        </Button>
        <Button
          as="a"
          className="w-full"
          size="lg"
          variant="outlined"
          href={`/users/${props.starkKey.toString()}`}
        >
          Back to assets
        </Button>
      </div>
    </>
  )
}

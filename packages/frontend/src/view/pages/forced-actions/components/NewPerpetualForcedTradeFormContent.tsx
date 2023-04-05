import React from 'react'

import { ArrowDownIcon } from '../../../assets/icons/ArrowIcon'
import { Button, LinkButton } from '../../../components/Button'
import { NewForcedActionFormProps } from '../NewForcedActionFormProps'
import { ForcedActionCard } from './ForcedActionCard'
import { AmountInput } from './form/AmountInput'
import { FormId } from './form/ids'
import { PriceInput } from './form/PriceInput'
import { TotalInput } from './form/TotalInput'

export function NewPerpetualForcedTradeFormContent(
  props: NewForcedActionFormProps
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
          <AmountInput {...props} />
        </ForcedActionCard>
        <ForcedActionCard>
          <PriceInput {...props} />
        </ForcedActionCard>
        <div className="flex items-center justify-center">
          <ArrowDownIcon className="rounded bg-slate-800 text-zinc-500" />
        </div>
        <ForcedActionCard>
          <TotalInput />
        </ForcedActionCard>
      </div>
      <div className="flex flex-col gap-2">
        <Button className="w-full" id={FormId.SubmitButton}>
          Create {label} offer
        </Button>
        <LinkButton
          className="w-full"
          variant="outlined"
          href={`/users/${props.starkKey.toString()}`}
        >
          Back to assets
        </LinkButton>
      </div>
    </>
  )
}

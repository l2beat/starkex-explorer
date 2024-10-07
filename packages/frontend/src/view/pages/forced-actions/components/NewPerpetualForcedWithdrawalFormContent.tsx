import { StarkKey } from '@explorer/types'
import React from 'react'

import { Button } from '../../../components/Button'
import { Link } from '../../../components/Link'
import { NewForcedActionFormAsset } from '../NewForcedActionFormProps'
import { ForcedActionCard } from './ForcedActionCard'
import { AmountInput } from './form/AmountInput'
import { FormId } from './form/ids'

interface NewPerpetualForcedWithdrawalFormContentProps {
  positionOrVaultId: bigint
  asset: NewForcedActionFormAsset
  starkKey: StarkKey
}

export function NewPerpetualForcedWithdrawalFormContent(
  props: NewPerpetualForcedWithdrawalFormContentProps
) {
  return (
    <>
      <div className="flex items-end justify-between">
        <span className="text-xl font-semibold">Withdrawal</span>
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
      </div>
      <div className="text-center">
        By initiating this action you agree to our{' '}
        <Link href="/tos">Terms of Service</Link>
      </div>
      <div className="flex flex-col gap-2">
        <Button className="w-full" size="lg" id={FormId.SubmitButton}>
          Prepare for withdrawal
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

import {
  CollateralAsset,
  PageContextWithUser,
  stringAs,
  stringAsBigInt,
  toJsonWithoutBigInts,
} from '@explorer/shared'
import { AssetId, EthereumAddress, Hash256, StarkKey } from '@explorer/types'
import React from 'react'
import { z } from 'zod'

import { Button } from '../../components/Button'
import { Link } from '../../components/Link'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'

export const FREEZE_REQUEST_FORM_ID = 'freeze-request-form'

type Props = {
  context: PageContextWithUser
  transactionHash: Hash256
} & FreezeRequestActionFormProps

export type FreezeRequestActionFormProps = z.infer<
  typeof FreezeRequestActionFormProps
>
export const FreezeRequestActionFormProps = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ForcedWithdrawal'),
    starkExAddress: stringAs(EthereumAddress),
    starkKey: stringAs(StarkKey),
    positionOrVaultId: stringAsBigInt(),
    quantizedAmount: stringAsBigInt(),
  }),
  z.object({
    type: z.literal('ForcedTrade'),
    starkExAddress: stringAs(EthereumAddress),
    collateralAsset: CollateralAsset,
    starkKeyA: stringAs(StarkKey),
    starkKeyB: stringAs(StarkKey),
    vaultIdA: stringAsBigInt(),
    vaultIdB: stringAsBigInt(),
    collateralAssetId: stringAs(AssetId),
    syntheticAssetId: stringAs(AssetId),
    amountCollateral: stringAsBigInt(),
    amountSynthetic: stringAsBigInt(),
    aIsBuyingSynthetic: z.boolean(),
    nonce: stringAsBigInt(),
  }),
])

export function serializeFreezeRequestActionFormProps(
  props: FreezeRequestActionFormProps
) {
  return toJsonWithoutBigInts(props)
}

function FreezeRequestActionPage(props: Props) {
  const { context, ...formProps } = props
  const formPropsJson = serializeFreezeRequestActionFormProps(formProps)
  const userJson = JSON.stringify(context.user)
  return (
    <Page
      path="/freeze"
      description="Request to freeze the exchange"
      context={props.context}
    >
      <main className="mx-auto flex-1 p-16">
        <div className="mt-6 flex max-w-md flex-col">
          <span className="text-xl font-semibold">Request Exchange Freeze</span>
          <span className="mt-3">
            The exchange operators have not fulfilled their obligation to
            included a "forced action" of one of the users. This means that the
            exchange can be frozen (essentially "shut down").
          </span>
          <span className="mt-3">
            You can see the ignored forced action{' '}
            <Link href={`/transactions/${props.transactionHash.toString()}`}>
              here
            </Link>
            .
          </span>
          <span className="mt-3">
            In the frozen state, the only possible operation is for users to
            withdraw their funds using so called "escape hatch", which interacts
            with the Ethereum blockchain directly.
          </span>
        </div>
        <form
          id={FREEZE_REQUEST_FORM_ID}
          className="flex flex-col items-center"
          data-props={formPropsJson}
          data-user={userJson}
        >
          <Button className="mt-6 w-fit">Request Freeze</Button>
        </form>
      </main>
    </Page>
  )
}

export function renderFreezeRequestActionPage(props: Props) {
  return reactToHtml(<FreezeRequestActionPage {...props} />)
}

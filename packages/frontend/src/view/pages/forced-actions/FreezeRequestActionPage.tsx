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
import { ContentWrapper } from '../../components/page/ContentWrapper'
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

export const FreezeRequestActionFormProps = z.intersection(
  z.object({
    starkExAddress: stringAs(EthereumAddress),
  }),
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('ForcedWithdrawal'),
      starkKey: stringAs(StarkKey),
      positionId: stringAsBigInt(),
      quantizedAmount: stringAsBigInt(),
    }),
    z.object({
      type: z.literal('ForcedTrade'),
      collateralAsset: CollateralAsset,
      starkKeyA: stringAs(StarkKey),
      starkKeyB: stringAs(StarkKey),
      positionIdA: stringAsBigInt(),
      positionIdB: stringAsBigInt(),
      collateralAssetId: stringAs(AssetId),
      syntheticAssetId: stringAs(AssetId),
      collateralAmount: stringAsBigInt(),
      syntheticAmount: stringAsBigInt(),
      isABuyingSynthetic: z.boolean(),
      nonce: stringAsBigInt(),
    }),
    z.object({
      type: z.literal('FullWithdrawal'),
      starkKey: stringAs(StarkKey),
      vaultId: stringAsBigInt(),
    }),
  ])
)

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
      <ContentWrapper className="max-w-5xl sm:max-w-xl">
        <div className="mt-6 flex  flex-col">
          <span className="text-xl font-semibold">Freeze exchange</span>
          <span className="mt-3">
            The exchange operators have not included a forced operation request
            (you can see it{' '}
            <Link href={`/transactions/${props.transactionHash.toString()}`}>
              here
            </Link>
            ), which means that the exchange can now be frozen (essentially
            "shut down").
          </span>
          <span className="mt-3">
            Once frozen, the only possible action is for users to withdraw their
            funds using the so-called "escape hatch", which interacts with the
            Ethereum blockchain directly.
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
      </ContentWrapper>
    </Page>
  )
}

export function renderFreezeRequestActionPage(props: Props) {
  return reactToHtml(<FreezeRequestActionPage {...props} />)
}

import {
  PageContextWithUser,
  stringAs,
  stringAsBigInt,
  toJsonWithoutBigInts,
} from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey } from '@explorer/types'
import React from 'react'
import { z } from 'zod'

import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'

export const FREEZE_REQUEST_FORM_ID = 'freeze-request-form'

interface Props {
  context: PageContextWithUser
  transactionHash: Hash256
  starkExAddress: EthereumAddress
  starkKey: StarkKey
  positionOrVaultId: bigint
  quantizedAmount: bigint
}

export type FreezeRequestActionFormProps = z.infer<
  typeof FreezeRequestActionFormProps
>
export const FreezeRequestActionFormProps = z.object({
  starkExAddress: stringAs(EthereumAddress),
  starkKey: stringAs(StarkKey),
  positionOrVaultId: stringAsBigInt(),
  quantizedAmount: stringAsBigInt(),
})

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
        <div className="my-auto flex gap-12">
          <div className="mt-6 flex max-w-md flex-col">
            <span className="text-xl font-semibold">
              Request Exchange Freeze
            </span>
            <span className="mt-3 text-sm font-semibold text-zinc-500">
              The exchange operators have not fulfilled their obligation to
              included a "forced action" of one of the users. This means that
              the exchange can be frozen (essentially "shut down").
            </span>
            <span className="mt-3 text-sm font-semibold text-zinc-500">
              You can see the ignored forced action:
              <a href={`/transactions/${props.transactionHash.toString()}`}>
                here
              </a>
            </span>
            <span className="mt-3 text-sm font-semibold text-zinc-500">
              In the frozen state, the only possible operation is for users to
              withdraw their funds using so called "escape hatch", which
              interacts with the Ethereum blockchain directly.
            </span>
          </div>
          <Card className="h-min w-[480px]">
            <form
              id={FREEZE_REQUEST_FORM_ID}
              className="flex flex-col gap-6"
              data-props={formPropsJson}
              data-user={userJson}
            >
              <Button className="w-full">Request Freeze</Button>
            </form>
          </Card>
        </div>
      </main>
    </Page>
  )
}

export function renderFreezeRequestActionPage(props: Props) {
  return reactToHtml(<FreezeRequestActionPage {...props} />)
}

import {
  PageContextWithUser,
  stringAs,
  stringAsBigInt,
  toJsonWithoutBigInts,
} from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'
import { z } from 'zod'

import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { OrderedList } from '../../components/OrderedList'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'
import { ForcedActionCard } from './components/ForcedActionCard'

export const VERIFY_ESCAPE_REQUEST_FORM_ID = 'verify-escape-request-form'

interface Props {
  context: PageContextWithUser
  starkKey: StarkKey
  escapeVerifierAddress: EthereumAddress
  positionOrVaultId: bigint
  serializedMerkleProof: bigint[]
  assetCount: number
  serializedState: bigint[]
}

export type VerifyEscapeFormProps = z.infer<typeof VerifyEscapeFormProps>
export const VerifyEscapeFormProps = z.object({
  escapeVerifierAddress: stringAs(EthereumAddress),
  positionOrVaultId: stringAsBigInt(),
  serializedMerkleProof: z.array(stringAsBigInt()),
  assetCount: z.number(),
  starkKey: stringAs(StarkKey),
  serializedState: z.array(stringAsBigInt()),
})

export function serializeVerifyEscapeFormProps(props: VerifyEscapeFormProps) {
  return toJsonWithoutBigInts(props)
}

function EscapeHatchActionPage(props: Props) {
  const { context, ...formProps } = props
  const formPropsJson = serializeVerifyEscapeFormProps(formProps)
  const userJson = JSON.stringify(context.user)
  const steps = [
    <> initiating (verifying) the escape (on this page)</>,
    <> finalizing the escape (on user page)</>,
    <>
      {' '}
      withdrawing the funds (on user page - must be carried out by the owner of
      this position){' '}
    </>,
  ]
  return (
    <Page
      path="/escape/:positionOrVaultId"
      description="Withdraw funds via Escape Hatch"
      context={props.context}
    >
      <main className="mx-auto flex-1 p-16">
        <div className="my-auto flex gap-12">
          <div className="flex max-w-md flex-col">
            <span className="mb-3">
              The exchange is frozen, preventing it from executing regular
              operations or supporting standard actions.
            </span>
            <span className="mb-3">
              You have the option to request a withdrawal of the entire value of
              any position by activating an 'escape hatch.' This process
              involves interacting with an Ethereum contract, which calculates
              the total value of the position, including any open trades and
              funding rates.
            </span>
            <span className="mb-3">
              The escape process consists of three steps:
            </span>
            <OrderedList items={steps} className="mb-3" />
            <span className="mb-3">
              Please note, the execution of an Escape can be expensive due to
              Ethereum gas cost.
            </span>
          </div>
          <Card className="h-min w-[480px]">
            <form
              id={VERIFY_ESCAPE_REQUEST_FORM_ID}
              className="flex flex-col gap-6"
              data-props={formPropsJson}
              data-user={userJson}
            >
              <div className="flex items-end justify-between text-xl font-semibold">
                Escape Hatch
              </div>
              <ForcedActionCard>
                <div className="flex gap-2">
                  <div className="flex flex-1 flex-col gap-2">
                    <span className="text-sm font-medium text-zinc-500">
                      Position
                    </span>
                    <span className="text-xl font-semibold">
                      #{props.positionOrVaultId.toString()}
                    </span>
                  </div>
                </div>
              </ForcedActionCard>
              <Button className="w-full">Initiate Escape</Button>
            </form>
          </Card>
        </div>
      </main>
    </Page>
  )
}

export function renderEscapeHatchActionPage(props: Props) {
  return reactToHtml(<EscapeHatchActionPage {...props} />)
}

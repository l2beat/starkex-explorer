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
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'

export const VERIFY_ESCAPE_REQUEST_FORM_ID = 'verify-escape-request-form'

type Props = {
  context: PageContextWithUser
} & VerifyEscapeFormProps

export type VerifyEscapeFormProps = z.infer<typeof VerifyEscapeFormProps>
export const VerifyEscapeFormProps = z.intersection(
  z.object({
    escapeVerifierAddress: stringAs(EthereumAddress),
    positionOrVaultId: stringAsBigInt(),
    starkKey: stringAs(StarkKey),
  }),
  z.discriminatedUnion('tradingMode', [
    z.object({
      tradingMode: z.literal('spot'),
      serializedEscapeProof: z.array(stringAsBigInt()),
    }),
    z.object({
      tradingMode: z.literal('perpetual'),
      serializedMerkleProof: z.array(stringAsBigInt()),
      assetCount: z.number(),
      serializedState: z.array(stringAsBigInt()),
    }),
  ])
)

export function serializeVerifyEscapeFormProps(props: VerifyEscapeFormProps) {
  return toJsonWithoutBigInts(props)
}

function EscapeHatchActionPage(props: Props) {
  const { context, ...formProps } = props
  const formPropsJson = serializeVerifyEscapeFormProps(formProps)
  const userJson = JSON.stringify(context.user)
  const steps = [
    <>Initiating (verifying) the escape (on this page)</>,
    <>Finalizing the escape (on user page)</>,
    <>
      Withdrawing the funds (on user page - must be carried out by the owner of
      this position){' '}
    </>,
  ]
  return (
    <Page
      path="/escape/:positionOrVaultId"
      description="Withdraw funds via Escape Hatch"
      context={props.context}
    >
      <ContentWrapper className="grid auto-rows-min grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-3">
          <div className="hidden text-xxl font-semibold lg:block">
            Escape your funds
          </div>
          <span className="text-sm font-semibold text-zinc-500 lg:mt-3">
            The exchange is frozen, preventing it from executing regular
            operations or supporting standard actions.
          </span>
          <span className="text-sm font-semibold text-zinc-500">
            You have the option to request a withdrawal of the entire value of
            any position by activating an 'escape hatch.' This process involves
            interacting with an Ethereum contract, which calculates the total
            value of the position, including any open trades and funding rates.
          </span>
          <span>The escape process consists of three steps:</span>
          <OrderedList items={steps} />
          <span className="text-sm font-semibold text-zinc-500">
            Please note, the execution of an Escape can be expensive due to
            Ethereum gas cost.
          </span>
        </div>
        <Card className="row-start-1 h-min lg:col-start-2">
          <form
            id={VERIFY_ESCAPE_REQUEST_FORM_ID}
            className="flex flex-col gap-6"
            data-props={formPropsJson}
            data-user={userJson}
          >
            <div className="flex items-end justify-between">
              <span className="text-xl font-semibold">Escape</span>
              <span>
                <span className="text-sm font-medium text-zinc-500">
                  {props.context.tradingMode === 'perpetual'
                    ? 'Position'
                    : 'Vault'}
                </span>{' '}
                <span className="text-lg font-semibold">
                  #{props.positionOrVaultId.toString()}
                </span>
              </span>
            </div>
            <Button className="w-full">Initiate Escape</Button>
          </form>
        </Card>
      </ContentWrapper>
    </Page>
  )
}

export function renderEscapeHatchActionPage(props: Props) {
  return reactToHtml(<EscapeHatchActionPage {...props} />)
}

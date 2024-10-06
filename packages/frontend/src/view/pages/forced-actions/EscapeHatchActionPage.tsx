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
import { Link } from '../../components/Link'
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
    <>Finalizing the escape (on User Page)</>,
    <>Withdrawing the funds (on User Page)</>,
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
          <span className="font-medium text-zinc-500 lg:mt-3">
            The exchange is frozen, preventing it from executing regular
            operations or supporting standard actions.
          </span>
          <span className="font-medium text-zinc-500">
            You have the option to request a withdrawal of the entire value of
            any position by activating an 'Escape Hatch.' This process involves
            interacting with an Ethereum contract, which calculates the total
            value of the position, including any open trades and funding rates.
          </span>
          <span className="font-bold">
            Ultimately the funds will be withdraw to the Ethereum address of the
            position's owner, regardless of the wallet used to perform the
            Escape Hatch transactions.
          </span>
          <span>The escape process consists of three steps:</span>
          <OrderedList items={steps} />
          <span className="font-medium text-zinc-500">
            Please note, the execution of an Escape can be expensive due to the
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
            <Button className="w-full" size="lg">
              Initiate Escape
            </Button>
            <div>
              By initiating the escape process, you agree to our{' '}
              <Link href="/tos">Terms of Service</Link>
            </div>
          </form>
        </Card>
      </ContentWrapper>
    </Page>
  )
}

export function renderEscapeHatchActionPage(props: Props) {
  return reactToHtml(<EscapeHatchActionPage {...props} />)
}

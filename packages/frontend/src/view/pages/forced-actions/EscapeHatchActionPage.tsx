import {
  PageContextWithUser,
  stringAs,
  stringAsBigInt,
  toJsonWithoutBigInts,
} from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'
import { z } from 'zod'

import { assetToInfo } from '../../../utils/assets'
import { formatWithDecimals } from '../../../utils/formatting/formatAmount'
import { InfoIcon } from '../../assets/icons/InfoIcon'
import { AssetWithLogo } from '../../components/AssetWithLogo'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Link } from '../../components/Link'
import { OrderedList } from '../../components/OrderedList'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TermsOfServiceAck } from '../../components/TermsOfServiceAck'
import { TooltipWrapper } from '../../components/Tooltip'
import { reactToHtml } from '../../reactToHtml'
import { PerformUserActionsPanel } from '../user/components/PerformUserActionsPanel'
import { ForcedActionCard } from './components/ForcedActionCard'

export const VERIFY_ESCAPE_REQUEST_FORM_ID = 'verify-escape-request-form'

type Props = {
  context: PageContextWithUser
  positionValue: bigint | undefined
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
      <ContentWrapper className="flex flex-col lg:gap-12">
        <PerformUserActionsPanel
          starkKey={props.starkKey}
          performUserActions={true}
          context={props.context}
        />
        <div className="grid auto-rows-min grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-12">
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
              any position by activating an{' '}
              <Link
                href="/tutorials/escapehatch"
                className="underline-offset-auto"
              >
                Escape Hatch
              </Link>
              . This process involves interacting with an Ethereum contract,
              which calculates the total value of the position, including any
              open trades and funding rates.
            </span>
            <span className="font-bold">
              Ultimately the funds will be withdraw to the Ethereum address of
              the position's owner, regardless of the wallet used to perform the
              Escape Hatch transactions.
            </span>
            <span>The escape process consists of three steps:</span>
            <OrderedList items={steps} />
            <span className="font-medium text-zinc-500">
              Please note, the execution of an Escape can be expensive due to
              the Ethereum gas cost.
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
              {props.positionValue !== undefined &&
              context.tradingMode === 'perpetual' ? (
                <ForcedActionCard>
                  <div className="flex gap-2">
                    <div className="flex flex-1 flex-col gap-2">
                      <span className="flex items-center gap-1 text-sm font-medium text-zinc-500">
                        Estimated value
                        <TooltipWrapper content="Exact value of the withdrawal will be calculated by the StarkEx smart contracts">
                          <InfoIcon className="h-3.5 w-3.5" />
                        </TooltipWrapper>
                      </span>
                      <span className="break-all text-xl font-semibold">
                        {formatWithDecimals(props.positionValue, 2)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-medium text-zinc-500">
                        Asset
                      </span>
                      <AssetWithLogo
                        assetInfo={assetToInfo({
                          hashOrId: context.collateralAsset.assetId,
                        })}
                      />
                    </div>
                  </div>
                </ForcedActionCard>
              ) : null}
              <TermsOfServiceAck
                prefix="By initiating the escape, you agree to dYdX v3"
                instanceName={props.context.instanceName}
              />
              <Button className="w-full" size="lg">
                Initiate Escape
              </Button>
            </form>
          </Card>
        </div>
      </ContentWrapper>
    </Page>
  )
}

export function renderEscapeHatchActionPage(props: Props) {
  return reactToHtml(<EscapeHatchActionPage {...props} />)
}

import React from 'react'

import { ArrowDownIcon } from '../../assets/icons/ArrowIcon'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Link } from '../../components/common/Link'
import { OrderedList } from '../../components/common/OrderedList'
import { Page } from '../../components/common/page/Page'
import { ForcedActionCard } from '../../components/forcedaction/ForcedActionCard'
import { AmountInput } from '../../components/forcedaction/form/AmountInput'
import { FormId } from '../../components/forcedaction/form/ids'
import { PriceInput } from '../../components/forcedaction/form/PriceInput'
import { TotalInput } from '../../components/forcedaction/form/TotalInput'
import { reactToHtml } from '../../reactToHtml'
import {
  ForcedActionFormProps,
  serializeForcedActionsFormProps,
} from './ForcedActionFormProps'

function ForcedTradePage(props: ForcedActionFormProps) {
  const instructions = [
    'You create a trade offer using this form. This is fully off-chain and does not require any gas fees.',
    'The trade offer will now be visible to all users of the system. You should seek out another user to accept the offer and become a counterparty to the trade. Accepting the offer is also fully off-chain and does not require any gas fees.',
    <span>
      <span className="text-yellow-300">
        Once the offer is accepted you can submit a trade request.
      </span>{' '}
      This is achieved through a mechanism called forced trades,{' '}
      <Link href="https://google.com">link to docs</Link>.
    </span>,
    'After submitting a forced trade request you must now wait up to seven days (but usually just several hours) for the operators of [system name] to process your request. Once this is done the trade will be executed and the funds will be transferred between you and the counterparty.',
  ]
  const selectedAssetBalance =
    props.assets.find((a) => a.assetId === props.selectedAsset)?.balance ?? 0
  const isBuying = selectedAssetBalance < 0
  const label = isBuying ? 'buy' : 'sell'
  const propsJson = serializeForcedActionsFormProps(props)

  return (
    <Page path="/forced" description="Description" account={props.account}>
      <div className="my-auto flex gap-12">
        <div className="flex flex-col">
          <span className="text-2xl font-semibold">Begin trade process</span>
          <span className="mt-6 text-sm font-semibold text-zinc-500">
            The trade process consists of four steps:
          </span>
          <OrderedList items={instructions} className="mt-3 max-w-[438px]" />
        </div>
        <Card className="h-min w-[480px]">
          <form
            id={FormId.Form}
            className="flex flex-col gap-6"
            data-props={propsJson}
          >
            <div className="flex items-end justify-between">
              <span className="text-2xl font-semibold">
                Forced {label} offer
              </span>
              <span>
                <span className="text-sm text-zinc-500">Position</span>{' '}
                <span className="font-semibold">11273</span>
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <ForcedActionCard>
                <AmountInput {...props} />
              </ForcedActionCard>
              <ForcedActionCard>
                <PriceInput {...props} />
              </ForcedActionCard>

              <div className="mx-auto flex h-6 w-6 items-center justify-center rounded bg-slate-800">
                <ArrowDownIcon className="fill-zinc-500" />
              </div>
              <ForcedActionCard>
                <TotalInput />
              </ForcedActionCard>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="w-full" id={FormId.SubmitButton}>
                Create {label} offer
              </Button>
              <Button className="w-full" variant="outlined">
                Back to assets
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  )
}

export function renderForcedTradePage(props: ForcedActionFormProps) {
  return reactToHtml(<ForcedTradePage {...props} />)
}

import { InstanceName } from '@explorer/shared'
import React from 'react'

import { Link } from '../../../components/Link'

const getWithdrawalInstructions = (instanceName: InstanceName) => [
  <>
    Using this form you request a withdrawal of your funds. (Perpetual only) You
    can only withdraw USDC, so to fully exit all funds you should first get rid
    of your synthetic assets by using the close functionality. (Perpetual only)
    This is achieved through a mechanism called forced withdrawals,{' '}
    <Link href="https://docs.starkware.co/starkex/perpetual/perpetual-trading-forced-withdrawal-and-forced-trade.html#forced_withdrawal">
      link to docs
    </Link>
    .
  </>,
  `After submitting a forced withdrawal request you must now wait up to seven days (but usually just several hours) for the operators of ${instanceName} to process your request.`,
  <>
    Once your request has been processed the status will change to{' '}
    <span className="text-yellow-300">’processed’</span> and you will be able to
    withdraw your funds by submitting a withdrawal transaction.
  </>,
]

const getTradeInstructions = (instanceName: InstanceName) => [
  'You create a trade offer using this form. This is fully off-chain and does not require any gas fees.',
  'The trade offer will now be visible to all users of the system. You should seek out another user to accept the offer and become a counterparty to the trade. Accepting the offer is also fully off-chain and does not require any gas fees.',
  <>
    <span className="text-yellow-300">
      Once the offer is accepted you can submit a trade request.
    </span>{' '}
    This is achieved through a mechanism called forced trades,{' '}
    <Link href="https://docs.starkware.co/starkex/perpetual/perpetual-trading-forced-withdrawal-and-forced-trade.html#forced_trade">
      link to docs
    </Link>
    .
  </>,
  `After submitting a forced trade request you must now wait up to seven days (but usually just several hours) for the operators of ${instanceName} to process your request. Once this is done the trade will be executed and the funds will be transferred between you and the counterparty.`,
]

export function getForcedActionInstructionsParams(
  isWithdrawal: boolean,
  instanceName: InstanceName
) {
  if (isWithdrawal) {
    return {
      header: 'Begin withdrawal process',
      description: 'The withdrawal process consists of three steps:',
      items: getWithdrawalInstructions(instanceName),
    }
  }
  return {
    header: 'Begin trade process',
    description: 'The trade process consists of four steps:',
    items: getTradeInstructions(instanceName),
  }
}

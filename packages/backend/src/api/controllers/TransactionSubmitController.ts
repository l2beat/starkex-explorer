import {
  decodeFinalizeExitRequest,
  decodeForcedTradeRequest,
  decodeForcedWithdrawalRequest,
  ForcedTradeRequest,
} from '@explorer/shared'
import { EthereumAddress, Hash256, Timestamp } from '@explorer/types'

import {
  ForcedTradeOfferRecord,
  ForcedTradeOfferRepository,
} from '../../peripherals/database/ForcedTradeOfferRepository'
import { ForcedTransactionsRepository } from '../../peripherals/database/ForcedTransactionsRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { sleep } from '../../tools/sleep'
import { ControllerResult } from './ControllerResult'

export class TransactionSubmitController {
  constructor(
    private ethereumClient: EthereumClient,
    private forcedTransactionsRepository: ForcedTransactionsRepository,
    private offersRepository: ForcedTradeOfferRepository,
    private perpetualAddress: EthereumAddress
  ) {}

  async submitForcedExit(hash: Hash256): Promise<ControllerResult> {
    const tx = await this.getTransaction(hash)
    if (!tx) {
      return { type: 'bad request', content: `Transaction ${hash} not found` }
    }
    const data = decodeForcedWithdrawalRequest(tx.data)
    if (!tx.to || EthereumAddress(tx.to) !== this.perpetualAddress || !data) {
      return { type: 'bad request', content: `Invalid transaction` }
    }
    const sentAt = Timestamp(Date.now())
    await this.forcedTransactionsRepository.add(
      {
        data: {
          type: 'withdrawal',
          amount: data.quantizedAmount,
          positionId: data.positionId,
          starkKey: data.starkKey,
        },
        hash,
      },
      sentAt
    )
    return { type: 'created', content: { id: hash } }
  }

  async finalizeForcedExit(
    exitHash: Hash256,
    finalizeHash: Hash256
  ): Promise<ControllerResult> {
    const tx = await this.getTransaction(finalizeHash)
    if (!tx) {
      return {
        type: 'bad request',
        content: `Transaction ${finalizeHash} not found`,
      }
    }
    const data = decodeFinalizeExitRequest(tx.data)
    if (!tx.to || EthereumAddress(tx.to) !== this.perpetualAddress || !data) {
      return { type: 'bad request', content: `Invalid transaction` }
    }
    const sentAt = Timestamp(Date.now())
    await this.forcedTransactionsRepository.saveFinalize(
      exitHash,
      finalizeHash,
      sentAt
    )
    return { type: 'success', content: finalizeHash.toString() }
  }

  async submitForcedTrade(
    hash: Hash256,
    offerId: number
  ): Promise<ControllerResult> {
    const offer = await this.offersRepository.findById(offerId)
    if (!offer) {
      return { type: 'not found', content: `Offer ${offerId} not found` }
    }
    if (
      !offer.accepted ||
      offer.cancelledAt ||
      offer.accepted.transactionHash
    ) {
      return { type: 'bad request', content: `Offer cannot be finalized` }
    }
    const tx = await this.getTransaction(hash)
    if (!tx) {
      return { type: 'bad request', content: `Transaction ${hash} not found` }
    }
    const data = decodeForcedTradeRequest(tx.data)
    if (
      !tx.to ||
      EthereumAddress(tx.to) !== this.perpetualAddress ||
      !data ||
      !tradeMatchesOffer(offer, data)
    ) {
      return { type: 'bad request', content: `Invalid transaction` }
    }
    const sentAt = Timestamp(Date.now())
    await this.forcedTransactionsRepository.add(
      {
        data: {
          type: 'trade',
          starkKeyA: data.starkKeyA,
          starkKeyB: data.starkKeyB,
          positionIdA: data.positionIdA,
          positionIdB: data.positionIdB,
          syntheticAssetId: data.syntheticAssetId,
          collateralAmount: data.collateralAmount,
          isABuyingSynthetic: data.isABuyingSynthetic,
          nonce: data.nonce,
          syntheticAmount: data.syntheticAmount,
        },
        hash,
        offerId,
      },
      sentAt
    )
    return { type: 'created', content: { id: hash } }
  }

  private async getTransaction(hash: Hash256) {
    for (const ms of [0, 1000, 4000]) {
      if (ms) {
        await sleep(ms)
      }
      const tx = await this.ethereumClient.getTransaction(hash)
      if (tx) {
        return tx
      }
    }
  }
}

function tradeMatchesOffer(
  offer: ForcedTradeOfferRecord,
  trade: ForcedTradeRequest
): boolean {
  return (
    offer.starkKeyA === trade.starkKeyA &&
    offer.accepted?.starkKeyB === trade.starkKeyB &&
    offer.positionIdA === trade.positionIdA &&
    offer.accepted.positionIdB === trade.positionIdB &&
    offer.collateralAmount === trade.collateralAmount &&
    offer.syntheticAmount === trade.syntheticAmount &&
    offer.isABuyingSynthetic === trade.isABuyingSynthetic &&
    offer.accepted.submissionExpirationTime ===
      trade.submissionExpirationTime &&
    offer.accepted.nonce === trade.nonce &&
    offer.accepted.signature === trade.signature &&
    offer.accepted.premiumCost === trade.premiumCost
  )
}

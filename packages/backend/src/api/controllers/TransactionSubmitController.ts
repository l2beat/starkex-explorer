import {
  CollateralAsset,
  decodePerpetualForcedTradeRequest,
  decodePerpetualForcedWithdrawalRequest,
  decodeWithdrawal,
  decodeWithdrawalWithTokenId,
  PerpetualForcedTradeRequest,
} from '@explorer/shared'
import { AssetHash, EthereumAddress, Hash256, Timestamp } from '@explorer/types'

import {
  ForcedTradeOfferRecord,
  ForcedTradeOfferRepository,
} from '../../peripherals/database/ForcedTradeOfferRepository'
import { SentTransactionRepository } from '../../peripherals/database/transactions/SentTransactionRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { sleep } from '../../tools/sleep'
import { ControllerResult } from './ControllerResult'

export class TransactionSubmitController {
  constructor(
    private ethereumClient: EthereumClient,
    private sentTransactionRepository: SentTransactionRepository,
    private offersRepository: ForcedTradeOfferRepository,
    private perpetualAddress: EthereumAddress,
    private collateralAsset: CollateralAsset | undefined,
    private retryTransactions = true
  ) {}

  async submitForcedExit(transactionHash: Hash256): Promise<ControllerResult> {
    const timestamp = Timestamp.now()
    const tx = await this.getTransaction(transactionHash)
    if (!tx) {
      return {
        type: 'bad request',
        content: `Transaction ${transactionHash.toString()} not found`,
      }
    }
    const data = decodePerpetualForcedWithdrawalRequest(tx.data)
    if (!tx.to || EthereumAddress(tx.to) !== this.perpetualAddress || !data) {
      return { type: 'bad request', content: `Invalid transaction` }
    }
    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'ForcedWithdrawal',
        quantizedAmount: data.quantizedAmount,
        positionId: data.positionId,
        starkKey: data.starkKey,
        premiumCost: data.premiumCost,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  async submitWithdrawal(transactionHash: Hash256): Promise<ControllerResult> {
    const timestamp = Timestamp.now()
    const tx = await this.getTransaction(transactionHash)
    if (!tx) {
      return {
        type: 'bad request',
        content: `Transaction ${transactionHash.toString()} not found`,
      }
    }
    const data = decodeWithdrawal(tx.data)
    if (!tx.to || EthereumAddress(tx.to) !== this.perpetualAddress || !data) {
      return { type: 'bad request', content: `Invalid transaction` }
    }
    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'Withdraw',
        starkKey: data.starkKey,
        assetType: AssetHash(data.assetTypeHash.toString()),
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  async submitWithdrawalWithTokenId(
    transactionHash: Hash256
  ): Promise<ControllerResult> {
    const timestamp = Timestamp.now()
    const tx = await this.getTransaction(transactionHash)
    if (!tx) {
      return {
        type: 'bad request',
        content: `Transaction ${transactionHash.toString()} not found`,
      }
    }
    const data = decodeWithdrawalWithTokenId(tx.data)
    if (!tx.to || EthereumAddress(tx.to) !== this.perpetualAddress || !data) {
      return { type: 'bad request', content: `Invalid transaction` }
    }
    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'WithdrawWithTokenId',
        starkKey: data.starkKey,
        assetType: data.assetTypeHash,
        tokenId: data.tokenId,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  private async getTransaction(hash: Hash256) {
    if (!this.retryTransactions) {
      return this.ethereumClient.getTransaction(hash)
    }
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

  async submitForcedTrade(
    transactionHash: Hash256,
    offerId: number
  ): Promise<ControllerResult> {
    if (!this.collateralAsset) {
      throw new Error('No collateral asset')
    }
    const timestamp = Timestamp.now()
    const offer = await this.offersRepository.findById(offerId)
    if (!offer) {
      return { type: 'not found', message: `Offer ${offerId} not found` }
    }
    if (
      !offer.accepted ||
      offer.cancelledAt ||
      offer.accepted.transactionHash
    ) {
      return { type: 'bad request', content: `Offer cannot be finalized` }
    }
    const tx = await this.getTransaction(transactionHash)
    if (!tx) {
      return {
        type: 'bad request',
        content: `Transaction ${transactionHash.toString()} not found`,
      }
    }
    const data = decodePerpetualForcedTradeRequest(
      tx.data,
      this.collateralAsset
    )
    if (
      !tx.to ||
      EthereumAddress(tx.to) !== this.perpetualAddress ||
      !data ||
      !tradeMatchesOffer(offer, data)
    ) {
      return { type: 'bad request', content: `Invalid transaction` }
    }
    // TODO: cross repository transaction
    await this.offersRepository.updateTransactionHash(offerId, transactionHash)
    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'ForcedTrade',
        starkKeyA: data.starkKeyA,
        starkKeyB: data.starkKeyB,
        positionIdA: data.positionIdA,
        positionIdB: data.positionIdB,
        collateralAmount: data.collateralAmount,
        collateralAssetId: this.collateralAsset.assetId,
        syntheticAmount: data.syntheticAmount,
        syntheticAssetId: data.syntheticAssetId,
        isABuyingSynthetic: data.isABuyingSynthetic,
        submissionExpirationTime: data.submissionExpirationTime,
        nonce: data.nonce,
        signatureB: data.signature,
        premiumCost: data.premiumCost,
        offerId,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }
}

function tradeMatchesOffer(
  offer: ForcedTradeOfferRecord,
  trade: PerpetualForcedTradeRequest
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

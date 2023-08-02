import {
  CollateralAsset,
  decodeFinalizeEscapeRequest,
  decodeFreezeRequest,
  decodePerpetualForcedTradeRequest,
  decodePerpetualForcedWithdrawalRequest,
  decodeWithdrawal,
  decodeWithdrawalWithTokenId,
  PerpetualForcedTradeRequest,
  validateVerifyEscapeRequest,
} from '@explorer/shared'
import {
  AssetHash,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'

import {
  ForcedTradeOfferRecord,
  ForcedTradeOfferRepository,
} from '../../peripherals/database/ForcedTradeOfferRepository'
import { SentTransactionRepository } from '../../peripherals/database/transactions/SentTransactionRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { sleep } from '../../tools/sleep'
import { ControllerResult, isControllerResult } from './ControllerResult'

export class TransactionSubmitController {
  constructor(
    private ethereumClient: EthereumClient,
    private sentTransactionRepository: SentTransactionRepository,
    private offersRepository: ForcedTradeOfferRepository,
    private contracts: {
      perpetual: EthereumAddress
      escapeVerifier: EthereumAddress
    },
    private collateralAsset: CollateralAsset | undefined,
    private retryTransactions = true
  ) {}

  async submitForcedExit(transactionHash: Hash256): Promise<ControllerResult> {
    const timestamp = Timestamp.now()
    const validatedData = await this.validate(
      transactionHash,
      this.contracts.perpetual,
      decodePerpetualForcedWithdrawalRequest
    )
    if (isControllerResult(validatedData)) {
      return validatedData
    }

    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'ForcedWithdrawal',
        quantizedAmount: validatedData.quantizedAmount,
        positionId: validatedData.positionId,
        starkKey: validatedData.starkKey,
        premiumCost: validatedData.premiumCost,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  async submitWithdrawal(transactionHash: Hash256): Promise<ControllerResult> {
    const timestamp = Timestamp.now()

    const validatedData = await this.validate(
      transactionHash,
      this.contracts.perpetual,
      decodeWithdrawal
    )
    if (isControllerResult(validatedData)) {
      return validatedData
    }

    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'Withdraw',
        starkKey: validatedData.starkKey,
        assetType: AssetHash(validatedData.assetTypeHash.toString()),
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  async submitWithdrawalWithTokenId(
    transactionHash: Hash256
  ): Promise<ControllerResult> {
    const timestamp = Timestamp.now()

    const validatedData = await this.validate(
      transactionHash,
      this.contracts.perpetual,
      decodeWithdrawalWithTokenId
    )
    if (isControllerResult(validatedData)) {
      return validatedData
    }

    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'WithdrawWithTokenId',
        starkKey: validatedData.starkKey,
        assetType: validatedData.assetTypeHash,
        tokenId: validatedData.tokenId,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
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
      return { type: 'not found', message: `Offer #${offerId} not found` }
    }
    if (
      !offer.accepted ||
      offer.cancelledAt ||
      offer.accepted.transactionHash
    ) {
      return {
        type: 'bad request',
        message: `Offer #${offerId} cannot be finalized`,
      }
    }

    const validatedData = await this.validate(
      transactionHash,
      this.contracts.perpetual,
      (data: string) => {
        if (!this.collateralAsset) {
          throw new Error('No collateral asset')
        }
        return decodePerpetualForcedTradeRequest(data, this.collateralAsset)
      }
    )
    if (isControllerResult(validatedData)) {
      return validatedData
    }
    if (!tradeMatchesOffer(offer, validatedData)) {
      return { type: 'bad request', message: `Trade does not match offer` }
    }

    // TODO: cross repository transaction
    await this.offersRepository.updateTransactionHash(offerId, transactionHash)
    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'ForcedTrade',
        starkKeyA: validatedData.starkKeyA,
        starkKeyB: validatedData.starkKeyB,
        positionIdA: validatedData.positionIdA,
        positionIdB: validatedData.positionIdB,
        collateralAmount: validatedData.collateralAmount,
        collateralAssetId: this.collateralAsset.assetId,
        syntheticAmount: validatedData.syntheticAmount,
        syntheticAssetId: validatedData.syntheticAssetId,
        isABuyingSynthetic: validatedData.isABuyingSynthetic,
        submissionExpirationTime: validatedData.submissionExpirationTime,
        nonce: validatedData.nonce,
        signatureB: validatedData.signature,
        premiumCost: validatedData.premiumCost,
        offerId,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  async submitFreezeRequest(
    transactionHash: Hash256
  ): Promise<ControllerResult> {
    const timestamp = Timestamp.now()
    const validatedData = await this.validate(
      transactionHash,
      this.contracts.perpetual,
      decodeFreezeRequest
    )
    if (isControllerResult(validatedData)) {
      return validatedData
    }

    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'FreezeRequest',
        starkKey: validatedData.starkKey,
        positionOrVaultId: validatedData.positionOrVaultId,
        quantizedAmount: validatedData.quantizedAmount,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  async submitEscapeVerified(
    transactionHash: Hash256,
    starkKey: StarkKey,
    positionOrVaultId: bigint
  ): Promise<ControllerResult> {
    const timestamp = Timestamp.now()
    const validatedData = await this.validate(
      transactionHash,
      this.contracts.escapeVerifier,
      validateVerifyEscapeRequest
    )
    if (isControllerResult(validatedData)) {
      return validatedData
    }

    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'EscapeVerified',
        starkKey,
        positionOrVaultId,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  async submitFinalizeEscape(
    transactionHash: Hash256
  ): Promise<ControllerResult> {
    const timestamp = Timestamp.now()
    const validatedData = await this.validate(
      transactionHash,
      this.contracts.perpetual,
      decodeFinalizeEscapeRequest
    )

    if (isControllerResult(validatedData)) {
      return validatedData
    }
    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'FinalizeEscape',
        starkKey: validatedData.starkKey,
        positionOrVaultId: validatedData.positionOrVaultId,
        quantizedAmount: validatedData.quantizedAmount,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  private async validate<T extends (data: string) => any>(
    transactionHash: Hash256,
    to: EthereumAddress,
    validateFn: T
  ): Promise<NonNullable<Awaited<ReturnType<T>>> | ControllerResult> {
    const tx = await this.getTransaction(transactionHash)
    if (!tx) {
      return {
        type: 'bad request',
        message: `Transaction ${transactionHash.toString()} not found`,
      }
    }

    const data = await validateFn(tx.data)
    if (!tx.to || EthereumAddress(tx.to) !== to || !data) {
      return { type: 'bad request', message: `Invalid transaction` }
    }

    return data
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

import {
  CollateralAsset,
  decodeFinalizeEscapeRequest,
  decodeForcedWithdrawalFreezeRequest,
  decodeFullWithdrawalFreezeRequest,
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
import { ControllerResult } from './ControllerResult'

type DecodeResult<T> =
  | { isSuccess: true; data: T }
  | { isSuccess: false; controllerResult: ControllerResult }

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
    const fetched = await this.fetchTxAndDecode(
      transactionHash,
      this.contracts.perpetual,
      decodePerpetualForcedWithdrawalRequest
    )
    if (!fetched.isSuccess) {
      return fetched.controllerResult
    }

    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'ForcedWithdrawal',
        quantizedAmount: fetched.data.quantizedAmount,
        positionId: fetched.data.positionId,
        starkKey: fetched.data.starkKey,
        premiumCost: fetched.data.premiumCost,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  async submitWithdrawal(transactionHash: Hash256): Promise<ControllerResult> {
    const timestamp = Timestamp.now()

    const fetched = await this.fetchTxAndDecode(
      transactionHash,
      this.contracts.perpetual,
      decodeWithdrawal
    )
    if (!fetched.isSuccess) {
      return fetched.controllerResult
    }

    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'Withdraw',
        starkKey: fetched.data.starkKey,
        assetType: AssetHash(fetched.data.assetTypeHash.toString()),
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  async submitWithdrawalWithTokenId(
    transactionHash: Hash256
  ): Promise<ControllerResult> {
    const timestamp = Timestamp.now()

    const fetched = await this.fetchTxAndDecode(
      transactionHash,
      this.contracts.perpetual,
      decodeWithdrawalWithTokenId
    )
    if (!fetched.isSuccess) {
      return fetched.controllerResult
    }

    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'WithdrawWithTokenId',
        starkKey: fetched.data.starkKey,
        assetType: fetched.data.assetTypeHash,
        tokenId: fetched.data.tokenId,
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

    const fetched = await this.fetchTxAndDecode(
      transactionHash,
      this.contracts.perpetual,
      (data: string) => {
        if (!this.collateralAsset) {
          throw new Error('No collateral asset')
        }
        return decodePerpetualForcedTradeRequest(data, this.collateralAsset)
      }
    )
    if (!fetched.isSuccess) {
      return fetched.controllerResult
    }
    if (!tradeMatchesOffer(offer, fetched.data)) {
      return { type: 'bad request', message: `Trade does not match offer` }
    }

    // TODO: cross repository transaction
    await this.offersRepository.updateTransactionHash(offerId, transactionHash)
    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'ForcedTrade',
        starkKeyA: fetched.data.starkKeyA,
        starkKeyB: fetched.data.starkKeyB,
        positionIdA: fetched.data.positionIdA,
        positionIdB: fetched.data.positionIdB,
        collateralAmount: fetched.data.collateralAmount,
        collateralAssetId: this.collateralAsset.assetId,
        syntheticAmount: fetched.data.syntheticAmount,
        syntheticAssetId: fetched.data.syntheticAssetId,
        isABuyingSynthetic: fetched.data.isABuyingSynthetic,
        submissionExpirationTime: fetched.data.submissionExpirationTime,
        nonce: fetched.data.nonce,
        signatureB: fetched.data.signature,
        premiumCost: fetched.data.premiumCost,
        offerId,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  async submitForcedWithdrawalFreezeRequest(
    transactionHash: Hash256
  ): Promise<ControllerResult> {
    const timestamp = Timestamp.now()
    const fetched = await this.fetchTxAndDecode(
      transactionHash,
      this.contracts.perpetual,
      decodeForcedWithdrawalFreezeRequest
    )
    if (!fetched.isSuccess) {
      return fetched.controllerResult
    }

    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'ForcedWithdrawalFreezeRequest',
        starkKey: fetched.data.starkKey,
        positionId: fetched.data.positionId,
        quantizedAmount: fetched.data.quantizedAmount,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  async submitForcedTradeFreezeRequest(
    transactionHash: Hash256
  ): Promise<ControllerResult> {
    const timestamp = Timestamp.now()
    const fetched = await this.fetchTxAndDecode(
      transactionHash,
      this.contracts.perpetual,
      (data: string) => {
        if (!this.collateralAsset) {
          throw new Error('No collateral asset')
        }
        return decodePerpetualForcedTradeRequest(data, this.collateralAsset)
      }
    )
    if (!fetched.isSuccess) {
      return fetched.controllerResult
    }

    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'ForcedTradeFreezeRequest',
        ...fetched.data,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  async submitFullWithdrawalFreezeRequest(
    transactionHash: Hash256
  ): Promise<ControllerResult> {
    const timestamp = Timestamp.now()
    const fetched = await this.fetchTxAndDecode(
      transactionHash,
      this.contracts.perpetual,
      decodeFullWithdrawalFreezeRequest
    )
    if (!fetched.isSuccess) {
      return fetched.controllerResult
    }

    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'FullWithdrawalFreezeRequest',
        ...fetched.data,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  async submitVerifyEscape(
    transactionHash: Hash256,
    starkKey: StarkKey,
    positionOrVaultId: bigint
  ): Promise<ControllerResult> {
    const timestamp = Timestamp.now()
    const fetched = await this.fetchTxAndDecode(
      transactionHash,
      this.contracts.escapeVerifier,
      validateVerifyEscapeRequest
    )
    if (!fetched.isSuccess) {
      return fetched.controllerResult
    }

    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'VerifyEscape',
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
    const fetched = await this.fetchTxAndDecode(
      transactionHash,
      this.contracts.perpetual,
      decodeFinalizeEscapeRequest
    )

    if (!fetched.isSuccess) {
      return fetched.controllerResult
    }
    await this.sentTransactionRepository.add({
      transactionHash,
      timestamp,
      data: {
        type: 'FinalizeEscape',
        starkKey: fetched.data.starkKey,
        positionOrVaultId: fetched.data.positionOrVaultId,
        quantizedAmount: fetched.data.quantizedAmount,
      },
    })
    return { type: 'created', content: { id: transactionHash } }
  }

  private async fetchTxAndDecode<T>(
    transactionHash: Hash256,
    to: EthereumAddress,
    validateFn: (data: string) => T | undefined
  ): Promise<DecodeResult<T>> {
    const tx = await this.getTransaction(transactionHash)
    if (!tx) {
      return {
        isSuccess: false,
        controllerResult: {
          type: 'bad request',
          message: `Transaction ${transactionHash.toString()} not found`,
        },
      }
    }
    const data = validateFn(tx.data)
    if (!tx.to || EthereumAddress(tx.to) !== to || !data) {
      return {
        isSuccess: false,
        controllerResult: {
          type: 'bad request',
          message: `Invalid transaction`,
        },
      }
    }

    return { isSuccess: true, data }
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

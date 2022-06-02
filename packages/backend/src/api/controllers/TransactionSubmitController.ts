import { decodeAssetId } from '@explorer/encoding'
import {
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { utils } from 'ethers'

import {
  ForcedTradeOfferRecord,
  ForcedTradeOfferRepository,
} from '../../peripherals/database/ForcedTradeOfferRepository'
import { ForcedTransactionsRepository } from '../../peripherals/database/ForcedTransactionsRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { sleep } from '../../tools/sleep'
import { ControllerResult } from './ControllerResult'

export const coder = new utils.Interface([
  'function forcedWithdrawalRequest(uint256 starkKey, uint256 vaultId, uint256 quantizedAmount, bool premiumCost)',
  `function forcedTradeRequest(
      uint256 starkKeyA, 
      uint256 starkKeyB, 
      uint256 vaultIdA, 
      uint256 vaultIdB, 
      uint256 collateralAssetId, 
      uint256 syntheticAssetId, 
      uint256 amountCollateral, 
      uint256 amountSynthetic, 
      bool aIsBuyingSynthetic, 
      uint256 submissionExpirationTime, 
      uint256 nonce, 
      bytes calldata signature, 
      bool premiumCost
    )`,
])

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
    const data = decodeWithdrawalData(tx.data)
    if (!tx.to || EthereumAddress(tx.to) !== this.perpetualAddress || !data) {
      return { type: 'bad request', content: `Invalid transaction` }
    }
    const sentAt = Timestamp(Date.now())
    await this.forcedTransactionsRepository.add(
      {
        data: {
          type: 'withdrawal',
          amount: data.quantizedAmount,
          positionId: data.vaultId,
          publicKey: data.starkKey,
        },
        hash,
      },
      sentAt
    )
    return { type: 'created', content: { id: hash } }
  }

  async submitForcedTrade(
    hash: Hash256,
    offerId: number
  ): Promise<ControllerResult> {
    const offer = await this.offersRepository.findById(offerId)
    if (!offer) {
      return { type: 'not found', content: `Offer not found` }
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
    const data = decodeTradeData(tx.data)
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
          publicKeyA: data.starkKeyA,
          publicKeyB: data.starkKeyB,
          positionIdA: data.positionIdA,
          positionIdB: data.positionIdB,
          syntheticAssetId: data.syntheticAssetId,
          collateralAmount: data.amountCollateral,
          isABuyingSynthetic: data.aIsBuyingSynthetic,
          nonce: data.nonce,
          syntheticAmount: data.amountSynthetic,
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

function decodeWithdrawalData(data: string) {
  try {
    const decoded = coder.decodeFunctionData('forcedWithdrawalRequest', data)
    return {
      starkKey: StarkKey.from(decoded.starkKey),
      vaultId: BigInt(decoded.vaultId),
      quantizedAmount: BigInt(decoded.quantizedAmount),
      premiumCost: Boolean(decoded.premiumCost),
    }
  } catch {
    return
  }
}

function tradeMatchesOffer(
  offer: ForcedTradeOfferRecord,
  trade: DecodedTrade
): boolean {
  return (
    offer.starkKeyA === trade.starkKeyA &&
    offer.accepted?.starkKeyB === trade.starkKeyB &&
    offer.positionIdA === trade.positionIdA &&
    offer.accepted?.positionIdB === trade.positionIdB &&
    offer.amountCollateral === trade.amountCollateral &&
    offer.amountSynthetic === trade.amountSynthetic &&
    offer.aIsBuyingSynthetic === trade.aIsBuyingSynthetic &&
    offer.accepted?.submissionExpirationTime ===
      trade.submissionExpirationTime &&
    offer.accepted?.nonce === trade.nonce &&
    offer.accepted?.signature === trade.signature &&
    offer.accepted?.premiumCost === trade.premiumCost
  )
}

interface DecodedTrade {
  starkKeyA: StarkKey
  starkKeyB: StarkKey
  positionIdA: bigint
  positionIdB: bigint
  collateralAssetId: AssetId
  syntheticAssetId: AssetId
  amountCollateral: bigint
  amountSynthetic: bigint
  aIsBuyingSynthetic: boolean
  submissionExpirationTime: bigint
  nonce: bigint
  signature: string
  premiumCost: boolean
}

function decodeTradeData(data: string): DecodedTrade | undefined {
  try {
    const decoded = coder.decodeFunctionData('forcedTradeRequest', data)
    return {
      starkKeyA: StarkKey.from(decoded.starkKeyA),
      starkKeyB: StarkKey.from(decoded.starkKeyB),
      positionIdA: BigInt(decoded.vaultIdA),
      positionIdB: BigInt(decoded.vaultIdB),
      collateralAssetId: decodeAssetId(decoded.collateralAssetId),
      syntheticAssetId: decodeAssetId(
        decoded.syntheticAssetId.toHexString().slice(2)
      ),
      amountCollateral: BigInt(decoded.amountCollateral),
      amountSynthetic: BigInt(decoded.amountSynthetic),
      aIsBuyingSynthetic: Boolean(decoded.aIsBuyingSynthetic),
      submissionExpirationTime: BigInt(decoded.submissionExpirationTime),
      nonce: BigInt(decoded.nonce),
      signature: String(decoded.signature),
      premiumCost: Boolean(decoded.premiumCost),
    }
  } catch {
    return
  }
}

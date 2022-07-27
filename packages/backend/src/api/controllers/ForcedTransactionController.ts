import {
  ForcedTransaction,
  renderForcedTransactionDetailsPage,
  renderForcedTransactionsIndexPage,
  renderTransactionForm,
} from '@explorer/frontend'
import { AssetId, EthereumAddress, Hash256 } from '@explorer/types'

import { AccountService } from '../../core/AccountService'
import { getTransactionStatus } from '../../core/getForcedTransactionStatus'
import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
import {
  ForcedTransactionRecord,
  ForcedTransactionsRepository,
} from '../../peripherals/database/ForcedTransactionsRepository'
import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { ControllerResult } from './ControllerResult'
import { toForcedTradeOfferHistory } from './utils/toForcedTradeOfferHistory'
import { toForcedTransactionEntry } from './utils/toForcedTransactionEntry'
import { toForcedTransactionHistory } from './utils/toForcedTransactionHistory'
import { toPositionAssetEntries } from './utils/toPositionAssetEntries'

export class ForcedTransactionController {
  constructor(
    private accountService: AccountService,
    private userRegistrationEventRepository: UserRegistrationEventRepository,
    private positionRepository: PositionRepository,
    private forcedTransactionsRepository: ForcedTransactionsRepository,
    private offersRepository: ForcedTradeOfferRepository,
    private perpetualAddress: EthereumAddress
  ) {}

  async getForcedTransactionsPage(
    page: number,
    perPage: number,
    address: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const limit = perPage
    const offset = (page - 1) * perPage
    const [account, transactions, total] = await Promise.all([
      this.accountService.getAccount(address),
      this.forcedTransactionsRepository.getLatest({ limit, offset }),
      this.forcedTransactionsRepository.countAll(),
    ])

    const content = renderForcedTransactionsIndexPage({
      account,
      transactions: transactions.map(toForcedTransactionEntry),
      total,
      params: { page, perPage },
    })
    return { type: 'success', content }
  }

  private async toForcedTransaction(
    transaction: ForcedTransactionRecord
  ): Promise<ForcedTransaction> {
    if (transaction.data.type === 'withdrawal') {
      const user = await this.userRegistrationEventRepository.findByStarkKey(
        transaction.data.starkKey
      )
      const status = getTransactionStatus(transaction)
      return {
        type: 'exit',
        data: {
          ethereumAddress: user?.ethAddress,
          positionId: transaction.data.positionId,
          transactionHash: transaction.hash,
          value: transaction.data.amount,
          stateUpdateId: transaction.updates.verified?.stateUpdateId,
          status,
          finalizeHash: transaction.updates.finalized?.hash,
        },
        finalizeForm:
          user &&
          (status === 'verified' ||
            status === 'finalize reverted' ||
            status === 'finalize forgotten')
            ? {
                address: user.ethAddress,
                transactionHash: transaction.hash,
                perpetualAddress: this.perpetualAddress,
                starkKey: user.starkKey,
              }
            : undefined,
      }
    }
    const [userA, userB] = await Promise.all([
      this.userRegistrationEventRepository.findByStarkKey(
        transaction.data.starkKeyA
      ),
      this.userRegistrationEventRepository.findByStarkKey(
        transaction.data.starkKeyB
      ),
    ])
    return {
      type: transaction.data.isABuyingSynthetic ? 'buy' : 'sell',
      data: {
        positionIdA: transaction.data.positionIdA,
        positionIdB: transaction.data.positionIdB,
        addressA: userA?.ethAddress,
        addressB: userB?.ethAddress,
        syntheticAmount: transaction.data.syntheticAmount,
        collateralAmount: transaction.data.collateralAmount,
        syntheticAssetId: transaction.data.syntheticAssetId,
        transactionHash: transaction.hash,
        stateUpdateId: transaction.updates.verified?.stateUpdateId,
      },
    }
  }

  async getForcedTransactionDetailsPage(
    transactionHash: Hash256,
    address: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const [account, transaction] = await Promise.all([
      this.accountService.getAccount(address),
      this.forcedTransactionsRepository.findByHash(transactionHash),
    ])
    if (!transaction) {
      const content = 'Could not find transaction for that hash'
      return { type: 'not found', content }
    }
    const offer = await this.offersRepository.findByHash(transaction.hash)
    const offerHistory = offer ? toForcedTradeOfferHistory(offer) : []

    const content = renderForcedTransactionDetailsPage({
      account,
      history: offerHistory.concat(toForcedTransactionHistory(transaction)),
      transaction: await this.toForcedTransaction(transaction),
    })
    return { type: 'success', content }
  }

  async getTransactionFormPage(
    address: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    if (!address) {
      return { type: 'redirect', url: '/' }
    }
    const account = await this.accountService.getAccount(address)
    if (account?.positionId === undefined) {
      return { type: 'redirect', url: '/' }
    }
    const position = await this.positionRepository.findByIdWithPrices(
      account.positionId
    )
    if (!position) {
      return { type: 'redirect', url: '/' }
    }

    const assets = toPositionAssetEntries(
      position.balances,
      position.collateralBalance,
      position.prices
    )

    if (
      assets.length === 0 ||
      (assets.length === 1 &&
        assets[0].assetId === AssetId.USDC &&
        assets[0].balance < 0n)
    ) {
      return { type: 'redirect', url: '/' }
    }

    return {
      type: 'success',
      content: renderTransactionForm({
        account,
        perpetualAddress: this.perpetualAddress,
        positionId: position.positionId,
        starkKey: position.starkKey,
        selectedAsset: assets[0].assetId,
        assets,
      }),
    }
  }
}

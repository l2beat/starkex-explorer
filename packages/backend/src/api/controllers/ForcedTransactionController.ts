import {
  ForcedTransaction,
  renderForcedTransactionDetailsPage,
  renderForcedTransactionsIndexPage,
  renderTransactionForm,
} from '@explorer/frontend'
import { AssetId, EthereumAddress, Hash256 } from '@explorer/types'

import { AccountService } from '../../core/AccountService'
import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
import { PositionRepository } from '../../peripherals/database/PositionRepository'
import {
  UserTransactionRecord,
  UserTransactionRepository,
} from '../../peripherals/database/transactions/UserTransactionRepository'
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
    private userTransactionRepository: UserTransactionRepository,
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
      this.userTransactionRepository.getPaginated({
        limit,
        offset,
        types: ['ForcedTrade', 'ForcedWithdrawal'],
      }),
      this.userTransactionRepository.countAll([
        'ForcedTrade',
        'ForcedWithdrawal',
      ]),
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
    transaction: UserTransactionRecord<'ForcedTrade' | 'ForcedWithdrawal'>,
    address?: EthereumAddress
  ): Promise<ForcedTransaction> {
    if (transaction.data.type === 'ForcedWithdrawal') {
      const user = await this.userRegistrationEventRepository.findByStarkKey(
        transaction.data.starkKey
      )
      return {
        type: 'exit',
        data: {
          ethereumAddress: user?.ethAddress,
          starkKey: transaction.data.starkKey,
          positionId: transaction.data.positionId,
          transactionHash: transaction.transactionHash,
          value: transaction.data.quantizedAmount,
          stateUpdateId: transaction.included?.stateUpdateId,
          status: transaction.included ? 'verified' : 'mined',
          finalizeHash: transaction.updates.finalized?.hash,
        },
        finalizeForm:
          user &&
          address &&
          (status === 'verified' ||
            status === 'finalize reverted' ||
            status === 'finalize forgotten')
            ? {
                address,
                transactionHash: transaction.hash,
                perpetualAddress: this.perpetualAddress,
                starkKey: transaction.data.starkKey,
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
        transactionHash: transaction.transactionHash,
        stateUpdateId: transaction.included?.stateUpdateId,
      },
    }
  }

  async getForcedTransactionDetailsPage(
    transactionHash: Hash256,
    address: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const [account, transaction] = await Promise.all([
      this.accountService.getAccount(address),
      this.userTransactionRepository.findByTransactionHash(transactionHash),
    ])
    if (!transaction) {
      const content = 'Could not find transaction for that hash'
      return { type: 'not found', content }
    }
    const offer = await this.offersRepository.findByHash(
      transaction.transactionHash
    )
    const offerHistory = offer ? toForcedTradeOfferHistory(offer) : []

    const content = renderForcedTransactionDetailsPage({
      account,
      history: offerHistory.concat(toForcedTransactionHistory(transaction)),
      transaction: await this.toForcedTransaction(
        transaction,
        account?.address
      ),
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

    const firstAsset = assets[0]
    if (
      !firstAsset ||
      (assets.length === 1 &&
        firstAsset.assetId === AssetId.USDC &&
        firstAsset.balance < 0n)
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
        selectedAsset: firstAsset.assetId,
        assets,
      }),
    }
  }
}

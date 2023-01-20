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
  SentTransactionRecord,
  SentTransactionRepository,
} from '../../peripherals/database/transactions/SentTransactionRepository'
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
    private sentTransactionRepository: SentTransactionRepository,
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

  async getForcedTransactionDetailsPage(
    transactionHash: Hash256,
    address: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const [account, transaction, sentTransaction] = await Promise.all([
      this.accountService.getAccount(address),
      this.userTransactionRepository.findByTransactionHash(transactionHash, [
        'ForcedTrade',
        'ForcedWithdrawal',
      ]),
      this.sentTransactionRepository.findByTransactionHash(transactionHash),
    ])
    if (
      !transaction &&
      (!sentTransaction ||
        (sentTransaction.data.type !== 'ForcedTrade' &&
          sentTransaction.data.type !== 'ForcedWithdrawal'))
    ) {
      const content = 'Could not find transaction for that hash'
      return { type: 'not found', content }
    }

    const [offer, sentWithdrawal] = await Promise.all([
      this.offersRepository.findByHash(transactionHash),
      transaction?.data.type === 'ForcedWithdrawal'
        ? this.sentTransactionRepository.findFirstWithdrawByStarkKeyAfter(
            transaction.data.starkKey,
            transaction.timestamp
          )
        : undefined,
    ])
    const offerHistory = offer ? toForcedTradeOfferHistory(offer) : []

    const content = renderForcedTransactionDetailsPage({
      account,
      history: offerHistory.concat(
        toForcedTransactionHistory(sentTransaction, transaction, sentWithdrawal)
      ),
      transaction: await this.toForcedTransaction(
        sentTransaction,
        transaction,
        sentWithdrawal,
        account?.address
      ),
    })
    return { type: 'success', content }
  }

  private async toForcedTransaction(
    sentTransaction: SentTransactionRecord | undefined,
    minedTransaction:
      | UserTransactionRecord<'ForcedTrade' | 'ForcedWithdrawal'>
      | undefined,
    sentWithdrawal: SentTransactionRecord | undefined,
    address: EthereumAddress | undefined
  ): Promise<ForcedTransaction> {
    if (!minedTransaction && !sentTransaction) {
      throw new Error('foo')
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const transaction = minedTransaction ?? sentTransaction!
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
          stateUpdateId: minedTransaction?.included?.stateUpdateId,
          finalizeHash: sentWithdrawal?.transactionHash,
        },
        finalizeForm:
          user && address && !sentWithdrawal
            ? {
                address,
                transactionHash: transaction.transactionHash,
                perpetualAddress: this.perpetualAddress,
                starkKey: transaction.data.starkKey,
              }
            : undefined,
      }
    }
    if (transaction.data.type === 'ForcedTrade') {
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
          stateUpdateId: minedTransaction?.included?.stateUpdateId,
        },
      }
    }
    throw new Error(`Unsupported transaction type ${transaction.data.type}`)
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

import { encodeAssetId } from '@explorer/encoding'
import {
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earljs'
import { providers } from 'ethers'

import {
  coder,
  TransactionSubmitController,
} from '../../../src/api/controllers/TransactionSubmitController'
import { ForcedTradeOfferRepository } from '../../../src/peripherals/database/ForcedTradeOfferRepository'
import { ForcedTransactionsRepository } from '../../../src/peripherals/database/ForcedTransactionsRepository'
import { EthereumClient } from '../../../src/peripherals/ethereum/EthereumClient'
import { fakeAccepted, fakeInitialOffer, fakeOffer } from '../../fakes'
import { mock } from '../../mock'

describe(TransactionSubmitController.name, () => {
  describe(TransactionSubmitController.prototype.submitForcedExit.name, () => {
    it('handles nonexistent transaction', async () => {
      const controller = new TransactionSubmitController(
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        mock<ForcedTradeOfferRepository>(),
        EthereumAddress.fake()
      )

      controller['getTransaction'] = async () => undefined

      const hash = Hash256.fake()
      const result = await controller.submitForcedExit(hash)

      expect(result).toEqual({
        type: 'bad request',
        content: `Transaction ${hash} not found`,
      })
    })

    it('handles transaction to a wrong address', async () => {
      const data = coder.encodeFunctionData('forcedWithdrawalRequest', [
        0,
        0,
        0,
        false,
      ])
      const controller = new TransactionSubmitController(
        mock<EthereumClient>({
          getTransaction: async () =>
            ({
              to: EthereumAddress.fake('b').toString(),
              data,
            } as providers.TransactionResponse),
        }),
        mock<ForcedTransactionsRepository>(),
        mock<ForcedTradeOfferRepository>(),
        EthereumAddress.fake('a')
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedExit(hash)

      expect(result).toEqual({
        type: 'bad request',
        content: `Invalid transaction`,
      })
    })

    it('handles transaction with unknown data', async () => {
      const controller = new TransactionSubmitController(
        mock<EthereumClient>({
          getTransaction: async () =>
            ({
              to: EthereumAddress.fake('a').toString(),
              data: '0x1234',
            } as providers.TransactionResponse),
        }),
        mock<ForcedTransactionsRepository>(),
        mock<ForcedTradeOfferRepository>(),
        EthereumAddress.fake('a')
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedExit(hash)

      expect(result).toEqual({
        type: 'bad request',
        content: `Invalid transaction`,
      })
    })

    it('handles transaction with correct data and address', async () => {
      const publicKey = StarkKey.fake()
      const positionId = 123n
      const amount = 456n
      const data = coder.encodeFunctionData('forcedWithdrawalRequest', [
        publicKey,
        positionId,
        amount,
        false,
      ])
      const perpetualAddress = EthereumAddress.fake()
      const hash = Hash256.fake()

      const repository = mock<ForcedTransactionsRepository>({
        add: async () => hash,
      })
      const controller = new TransactionSubmitController(
        mock<EthereumClient>({
          getTransaction: async () =>
            ({
              to: perpetualAddress.toString(),
              data,
            } as providers.TransactionResponse),
        }),
        repository,
        mock<ForcedTradeOfferRepository>(),
        perpetualAddress
      )

      const result = await controller.submitForcedExit(hash)

      expect(result).toEqual({
        type: 'created',
        content: { id: hash },
      })
    })
  })
  describe(TransactionSubmitController.prototype.submitForcedTrade.name, () => {
    it('handles nonexistent offer', async () => {
      const controller = new TransactionSubmitController(
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        mock<ForcedTradeOfferRepository>({ findById: async () => undefined }),
        EthereumAddress.fake()
      )

      const offerId = 1
      const result = await controller.submitForcedTrade(Hash256.fake(), offerId)

      expect(result).toEqual({
        type: 'not found',
        content: `Offer ${offerId} not found`,
      })
    })

    it('blocks initial offer', async () => {
      const offer = fakeInitialOffer()
      const controller = new TransactionSubmitController(
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        mock<ForcedTradeOfferRepository>({ findById: async () => offer }),
        EthereumAddress.fake()
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedTrade(hash, offer.id)

      expect(result).toEqual({
        type: 'bad request',
        content: `Offer cannot be finalized`,
      })
    })

    it('blocks cancelled offer', async () => {
      const offer = fakeOffer({ cancelledAt: Timestamp(Date.now()) })
      const controller = new TransactionSubmitController(
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        mock<ForcedTradeOfferRepository>({ findById: async () => offer }),
        EthereumAddress.fake()
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedTrade(hash, offer.id)

      expect(result).toEqual({
        type: 'bad request',
        content: `Offer cannot be finalized`,
      })
    })

    it('blocks submitted offer', async () => {
      const offer = fakeOffer({
        accepted: fakeAccepted({ transactionHash: Hash256.fake() }),
      })
      const controller = new TransactionSubmitController(
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        mock<ForcedTradeOfferRepository>({ findById: async () => offer }),
        EthereumAddress.fake()
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedTrade(hash, offer.id)

      expect(result).toEqual({
        type: 'bad request',
        content: `Offer cannot be finalized`,
      })
    })

    it('handles nonexistent transaction', async () => {
      const offer = fakeOffer()
      const controller = new TransactionSubmitController(
        mock<EthereumClient>(),
        mock<ForcedTransactionsRepository>(),
        mock<ForcedTradeOfferRepository>({ findById: async () => offer }),
        EthereumAddress.fake()
      )

      controller['getTransaction'] = async () => undefined

      const hash = Hash256.fake()
      const result = await controller.submitForcedTrade(hash, offer.id)

      expect(result).toEqual({
        type: 'bad request',
        content: `Transaction ${hash} not found`,
      })
    })

    it('handles transaction to a wrong address', async () => {
      const data = coder.encodeFunctionData('forcedTradeRequest', [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        false,
        0,
        0,
        0,
        false,
      ])
      const offer = fakeOffer()
      const controller = new TransactionSubmitController(
        mock<EthereumClient>({
          getTransaction: async () =>
            ({
              to: EthereumAddress.fake('b').toString(),
              data,
            } as providers.TransactionResponse),
        }),
        mock<ForcedTransactionsRepository>(),
        mock<ForcedTradeOfferRepository>({ findById: async () => offer }),
        EthereumAddress.fake('a')
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedTrade(hash, offer.id)

      expect(result).toEqual({
        type: 'bad request',
        content: `Invalid transaction`,
      })
    })

    it('handles transaction with unknown data', async () => {
      const accepted = fakeAccepted({ signature: Hash256.fake().toString() })
      const offer = fakeOffer({ accepted })
      const data = coder.encodeFunctionData('forcedTradeRequest', [
        StarkKey.fake(),
        offer.accepted?.starkKeyB,
        offer.positionIdA,
        offer.accepted?.positionIdB,
        '0x' + encodeAssetId(AssetId.USDC),
        '0x' + encodeAssetId(offer.syntheticAssetId),
        offer.amountCollateral,
        offer.amountSynthetic,
        offer.aIsBuyingSynthetic,
        offer.accepted?.submissionExpirationTime,
        offer.accepted?.nonce,
        offer.accepted?.signature,
        offer.accepted?.premiumCost,
      ])
      const perpetualAddress = EthereumAddress.fake()

      const controller = new TransactionSubmitController(
        mock<EthereumClient>({
          getTransaction: async () =>
            ({
              to: perpetualAddress.toString(),
              data,
            } as providers.TransactionResponse),
        }),
        mock<ForcedTransactionsRepository>(),
        mock<ForcedTradeOfferRepository>({ findById: async () => offer }),
        perpetualAddress
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedTrade(hash, offer.id)

      expect(result).toEqual({
        type: 'bad request',
        content: `Invalid transaction`,
      })
    })

    it('handles transaction with correct data and address', async () => {
      const accepted = fakeAccepted({ signature: Hash256.fake().toString() })
      const offer = fakeOffer({ accepted })
      const data = coder.encodeFunctionData('forcedTradeRequest', [
        offer.starkKeyA,
        offer.accepted?.starkKeyB,
        offer.positionIdA,
        offer.accepted?.positionIdB,
        '0x' + encodeAssetId(AssetId.USDC),
        '0x' + encodeAssetId(offer.syntheticAssetId),
        offer.amountCollateral,
        offer.amountSynthetic,
        offer.aIsBuyingSynthetic,
        offer.accepted?.submissionExpirationTime,
        offer.accepted?.nonce,
        offer.accepted?.signature,
        offer.accepted?.premiumCost,
      ])
      const perpetualAddress = EthereumAddress.fake()
      const hash = Hash256.fake()

      const repository = mock<ForcedTransactionsRepository>({
        add: async () => hash,
      })
      const controller = new TransactionSubmitController(
        mock<EthereumClient>({
          getTransaction: async () =>
            ({
              to: perpetualAddress.toString(),
              data,
            } as providers.TransactionResponse),
        }),
        repository,
        mock<ForcedTradeOfferRepository>({ findById: async () => offer }),
        perpetualAddress
      )

      const result = await controller.submitForcedTrade(hash, 1)

      expect(result).toEqual({
        type: 'created',
        content: { id: hash },
      })
    })
  })
})

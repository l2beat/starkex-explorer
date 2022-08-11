import {
  encodeFinalizeExitRequest,
  encodeForcedTradeRequest,
  encodeForcedWithdrawalRequest,
} from '@explorer/shared'
import {
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earljs'
import { providers } from 'ethers'

import { TransactionSubmitController } from '../../../src/api/controllers/TransactionSubmitController'
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
      const data = encodeForcedWithdrawalRequest({
        starkKey: StarkKey.fake(),
        positionId: 0n,
        quantizedAmount: 0n,
        premiumCost: false,
      })
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
      const data = encodeForcedWithdrawalRequest({
        starkKey: StarkKey.fake(),
        positionId: 0n,
        quantizedAmount: 0n,
        premiumCost: false,
      })
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
      const data = encodeForcedTradeRequest({
        starkKeyA: StarkKey.fake(),
        positionIdA: 0n,
        syntheticAssetId: AssetId.USDC,
        collateralAmount: 0n,
        syntheticAmount: 0n,
        isABuyingSynthetic: false,
        nonce: 0n,
        signature: Hash256.fake().toString(),
        starkKeyB: StarkKey.fake(),
        positionIdB: 0n,
        submissionExpirationTime: 0n,
        premiumCost: false,
      })
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
      const data = encodeForcedTradeRequest({
        ...offer,
        ...accepted,
        starkKeyA: StarkKey.fake(),
      })
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
      const data = encodeForcedTradeRequest({
        ...offer,
        ...accepted,
      })
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
  describe(
    TransactionSubmitController.prototype.finalizeForcedExit.name,
    () => {
      it('handles nonexistent transaction', async () => {
        const controller = new TransactionSubmitController(
          mock<EthereumClient>(),
          mock<ForcedTransactionsRepository>(),
          mock<ForcedTradeOfferRepository>(),
          EthereumAddress.fake()
        )

        controller['getTransaction'] = async () => undefined

        const exitHash = Hash256.fake()
        const finalizeHash = Hash256.fake()
        const result = await controller.finalizeForcedExit(
          exitHash,
          finalizeHash
        )

        expect(result).toEqual({
          type: 'bad request',
          content: `Transaction ${finalizeHash} not found`,
        })
      })

      it('handles transaction to a wrong address', async () => {
        const data = encodeFinalizeExitRequest(StarkKey.fake())
        const controller = new TransactionSubmitController(
          mock<EthereumClient>({
            getTransaction: async () =>
              ({
                to: EthereumAddress.fake().toString(),
                data,
              } as providers.TransactionResponse),
          }),
          mock<ForcedTransactionsRepository>(),
          mock<ForcedTradeOfferRepository>(),
          EthereumAddress.fake('a')
        )

        const exitHash = Hash256.fake()
        const finalizeHash = Hash256.fake()
        const result = await controller.finalizeForcedExit(
          exitHash,
          finalizeHash
        )

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
        const data = encodeFinalizeExitRequest(StarkKey.fake())
        const perpetualAddress = EthereumAddress.fake()
        const exitHash = Hash256.fake()
        const finalizeHash = Hash256.fake()

        const repository = mock<ForcedTransactionsRepository>({
          saveFinalize: async () => true,
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

        const result = await controller.finalizeForcedExit(
          exitHash,
          finalizeHash
        )
        expect(result).toEqual({
          type: 'success',
          content: finalizeHash.toString(),
        })
      })
    }
  )
})

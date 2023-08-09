import {
  decodeFinalizeEscapeRequest,
  decodeForcedWithdrawalFreezeRequest,
  decodeFullWithdrawalFreezeRequest,
  decodePerpetualForcedWithdrawalRequest,
  decodeWithdrawal,
  validateVerifyPerpetualEscapeRequest,
} from '@explorer/shared'
import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect, mockFn, mockObject } from 'earl'
import { it } from 'mocha'

import { TransactionValidator } from '../../core/TransactionValidator'
import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
import { SentTransactionRepository } from '../../peripherals/database/transactions/SentTransactionRepository'
import {
  fakeAccepted,
  fakeCollateralAsset,
  fakeInitialOffer,
  fakeOffer,
} from '../../test/fakes'
import { TransactionSubmitController } from './TransactionSubmitController'

describe(TransactionSubmitController.name, () => {
  describe(TransactionSubmitController.prototype.submitForcedExit.name, () => {
    it('handles transaction with correct data and address', async () => {
      const decodedData = {
        starkKey: StarkKey.fake(),
        positionId: 0n,
        quantizedAmount: 0n,
        premiumCost: false,
      }
      const perpetualAddress = EthereumAddress.fake()
      const hash = Hash256.fake()

      const transactionValidator = mockObject<TransactionValidator>({
        fetchTxAndDecode: mockFn().resolvesTo({
          isSuccess: true,
          data: decodedData,
        }),
      })
      const repository = mockObject<SentTransactionRepository>({
        add: async () => hash,
      })
      const controller = new TransactionSubmitController(
        transactionValidator,
        repository,
        mockObject<ForcedTradeOfferRepository>(),
        {
          perpetual: perpetualAddress,
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const result = await controller.submitForcedExit(hash)

      expect(result).toEqual({
        type: 'created',
        content: { id: hash },
      })
      expect(transactionValidator.fetchTxAndDecode).toHaveBeenOnlyCalledWith(
        hash,
        perpetualAddress,
        decodePerpetualForcedWithdrawalRequest
      )
      expect(repository.add).toHaveBeenOnlyCalledWith({
        transactionHash: hash,
        timestamp: expect.a(BigInt),
        data: {
          type: 'ForcedWithdrawal',
          quantizedAmount: decodedData.quantizedAmount,
          positionId: decodedData.positionId,
          starkKey: decodedData.starkKey,
          premiumCost: decodedData.premiumCost,
        },
      })
    })

    it('handles transaction with incorrect data', async () => {
      const controllerResult = {
        type: 'bad request',
        message: 'Invalid transaction',
      } as const
      const transactionValidator = mockObject<TransactionValidator>({
        fetchTxAndDecode: mockFn().resolvesTo({
          isSuccess: false,
          controllerResult,
        }),
      })
      const controller = new TransactionSubmitController(
        transactionValidator,
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>(),
        {
          perpetual: EthereumAddress.fake(),
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const result = await controller.submitForcedExit(Hash256.fake())

      expect(result).toEqual(controllerResult)
    })
  })

  describe(TransactionSubmitController.prototype.submitForcedTrade.name, () => {
    it('handles nonexistent offer', async () => {
      const controller = new TransactionSubmitController(
        mockObject<TransactionValidator>(),
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>({
          findById: async () => undefined,
        }),
        {
          perpetual: EthereumAddress.fake(),
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const offerId = 1
      const result = await controller.submitForcedTrade(Hash256.fake(), offerId)

      expect(result).toEqual({
        type: 'not found',
        message: `Offer #${offerId} not found`,
      })
    })

    it('blocks initial offer', async () => {
      const offer = fakeInitialOffer()
      const controller = new TransactionSubmitController(
        mockObject<TransactionValidator>(),
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>({ findById: async () => offer }),
        {
          perpetual: EthereumAddress.fake(),
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedTrade(hash, offer.id)

      expect(result).toEqual({
        type: 'bad request',
        message: `Offer #${offer.id} cannot be finalized`,
      })
    })

    it('blocks cancelled offer', async () => {
      const offer = fakeOffer({ cancelledAt: Timestamp.now() })
      const controller = new TransactionSubmitController(
        mockObject<TransactionValidator>(),
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>({ findById: async () => offer }),
        {
          perpetual: EthereumAddress.fake(),
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedTrade(hash, offer.id)

      expect(result).toEqual({
        type: 'bad request',
        message: `Offer #${offer.id} cannot be finalized`,
      })
    })

    it('blocks submitted offer', async () => {
      const offer = fakeOffer({
        accepted: fakeAccepted({ transactionHash: Hash256.fake() }),
      })
      const controller = new TransactionSubmitController(
        mockObject<TransactionValidator>(),
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>({ findById: async () => offer }),
        {
          perpetual: EthereumAddress.fake(),
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedTrade(hash, offer.id)

      expect(result).toEqual({
        type: 'bad request',
        message: `Offer #${offer.id} cannot be finalized`,
      })
    })

    it('handles transaction with correct data and address', async () => {
      const accepted = fakeAccepted({ signature: Hash256.fake().toString() })
      const offer = fakeOffer({ accepted })
      const decodedData = {
        ...offer,
        ...accepted,
        collateralAssetId: fakeCollateralAsset.assetId,
      }
      const perpetualAddress = EthereumAddress.fake()
      const hash = Hash256.fake()

      const transactionValidator = mockObject<TransactionValidator>({
        fetchTxAndDecode: mockFn().resolvesTo({
          isSuccess: true,
          data: decodedData,
        }),
      })
      const sentTransactionRepository = mockObject<SentTransactionRepository>({
        add: async () => hash,
      })
      const forcedTradeOfferRepository = mockObject<ForcedTradeOfferRepository>(
        {
          findById: async () => offer,
          updateTransactionHash: async () => 1,
        }
      )
      const controller = new TransactionSubmitController(
        transactionValidator,
        sentTransactionRepository,
        forcedTradeOfferRepository,
        {
          perpetual: perpetualAddress,
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const result = await controller.submitForcedTrade(hash, offer.id)

      expect(result).toEqual({
        type: 'created',
        content: { id: hash },
      })
      expect(transactionValidator.fetchTxAndDecode).toHaveBeenOnlyCalledWith(
        hash,
        perpetualAddress,
        expect.a(Function)
      )
      expect(sentTransactionRepository.add).toHaveBeenOnlyCalledWith({
        transactionHash: hash,
        timestamp: expect.a(BigInt),
        data: {
          type: 'ForcedTrade',
          starkKeyA: decodedData.starkKeyA,
          starkKeyB: decodedData.starkKeyB,
          positionIdA: decodedData.positionIdA,
          positionIdB: decodedData.positionIdB,
          collateralAssetId: decodedData.collateralAssetId,
          syntheticAssetId: decodedData.syntheticAssetId,
          collateralAmount: decodedData.collateralAmount,
          syntheticAmount: decodedData.syntheticAmount,
          isABuyingSynthetic: decodedData.isABuyingSynthetic,
          submissionExpirationTime: decodedData.submissionExpirationTime,
          nonce: decodedData.nonce,
          signatureB: decodedData.signature,
          premiumCost: decodedData.premiumCost,
          offerId: decodedData.id,
        },
      })
    })
  })

  describe(TransactionSubmitController.prototype.submitWithdrawal.name, () => {
    it('handles transaction with correct data and address', async () => {
      const decodedData = {
        starkKey: StarkKey.fake(),
        assetTypeHash: AssetHash.fake(),
      }
      const perpetualAddress = EthereumAddress.fake()
      const hash = Hash256.fake()

      const transactionValidator = mockObject<TransactionValidator>({
        fetchTxAndDecode: mockFn().resolvesTo({
          isSuccess: true,
          data: decodedData,
        }),
      })
      const repository = mockObject<SentTransactionRepository>({
        add: async () => hash,
      })
      const controller = new TransactionSubmitController(
        transactionValidator,
        repository,
        mockObject<ForcedTradeOfferRepository>(),
        {
          perpetual: perpetualAddress,
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const result = await controller.submitWithdrawal(hash)

      expect(result).toEqual({
        type: 'created',
        content: { id: hash },
      })
      expect(transactionValidator.fetchTxAndDecode).toHaveBeenOnlyCalledWith(
        hash,
        perpetualAddress,
        decodeWithdrawal
      )
      expect(repository.add).toHaveBeenOnlyCalledWith({
        transactionHash: hash,
        timestamp: expect.a(BigInt),
        data: {
          type: 'Withdraw',
          starkKey: decodedData.starkKey,
          assetType: decodedData.assetTypeHash,
        },
      })
    })

    it('handles transaction with incorrect data', async () => {
      const controllerResult = {
        type: 'bad request',
        message: 'Invalid transaction',
      } as const
      const transactionValidator = mockObject<TransactionValidator>({
        fetchTxAndDecode: mockFn().resolvesTo({
          isSuccess: false,
          controllerResult,
        }),
      })
      const controller = new TransactionSubmitController(
        transactionValidator,
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>(),
        {
          perpetual: EthereumAddress.fake(),
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const result = await controller.submitWithdrawal(Hash256.fake())

      expect(result).toEqual(controllerResult)
    })
  })

  describe(
    TransactionSubmitController.prototype.submitVerifyEscape.name,
    () => {
      it('handles transaction with correct data and address', async () => {
        const escapeVerifierAddress = EthereumAddress.fake()
        const hash = Hash256.fake()

        const transactionValidator = mockObject<TransactionValidator>({
          fetchTxAndDecode: mockFn().resolvesTo({
            isSuccess: true,
            data: true,
          }),
        })
        const repository = mockObject<SentTransactionRepository>({
          add: async () => hash,
        })
        const controller = new TransactionSubmitController(
          transactionValidator,
          repository,
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: EthereumAddress.fake(),
            escapeVerifier: escapeVerifierAddress,
          },
          fakeCollateralAsset
        )
        const starkKey = StarkKey.fake()
        const positionOrVaultId = 1234n

        const result = await controller.submitVerifyEscape(
          hash,
          starkKey,
          positionOrVaultId
        )

        expect(result).toEqual({
          type: 'created',
          content: { id: hash },
        })
        expect(transactionValidator.fetchTxAndDecode).toHaveBeenOnlyCalledWith(
          hash,
          escapeVerifierAddress,
          validateVerifyPerpetualEscapeRequest
        )
        expect(repository.add).toHaveBeenOnlyCalledWith({
          transactionHash: hash,
          timestamp: expect.a(BigInt),
          data: {
            type: 'VerifyEscape',
            starkKey,
            positionOrVaultId,
          },
        })
      })

      it('handles transaction with incorrect data', async () => {
        const controllerResult = {
          type: 'bad request',
          message: 'Invalid transaction',
        } as const
        const transactionValidator = mockObject<TransactionValidator>({
          fetchTxAndDecode: mockFn().resolvesTo({
            isSuccess: false,
            controllerResult,
          }),
        })
        const controller = new TransactionSubmitController(
          transactionValidator,
          mockObject<SentTransactionRepository>(),
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: EthereumAddress.fake(),
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset
        )

        const result = await controller.submitVerifyEscape(
          Hash256.fake(),
          StarkKey.fake(),
          1234n
        )

        expect(result).toEqual(controllerResult)
      })
    }
  )

  describe(
    TransactionSubmitController.prototype.submitForcedWithdrawalFreezeRequest
      .name,
    () => {
      it('handles transaction with correct data and address', async () => {
        const decodedData = {
          starkKey: StarkKey.fake(),
          positionId: 1234n,
          quantizedAmount: 5000n,
        }
        const perpetualAddress = EthereumAddress.fake()
        const hash = Hash256.fake()

        const transactionValidator = mockObject<TransactionValidator>({
          fetchTxAndDecode: mockFn().resolvesTo({
            isSuccess: true,
            data: decodedData,
          }),
        })
        const repository = mockObject<SentTransactionRepository>({
          add: async () => hash,
        })
        const controller = new TransactionSubmitController(
          transactionValidator,
          repository,
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: perpetualAddress,
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset
        )

        const result = await controller.submitForcedWithdrawalFreezeRequest(
          hash
        )

        expect(result).toEqual({
          type: 'created',
          content: { id: hash },
        })
        expect(transactionValidator.fetchTxAndDecode).toHaveBeenOnlyCalledWith(
          hash,
          perpetualAddress,
          decodeForcedWithdrawalFreezeRequest
        )
        expect(repository.add).toHaveBeenOnlyCalledWith({
          transactionHash: hash,
          timestamp: expect.a(BigInt),
          data: {
            type: 'ForcedWithdrawalFreezeRequest',
            starkKey: decodedData.starkKey,
            positionId: decodedData.positionId,
            quantizedAmount: decodedData.quantizedAmount,
          },
        })
      })

      it('handles transaction with incorrect data', async () => {
        const controllerResult = {
          type: 'bad request',
          message: 'Invalid transaction',
        } as const
        const transactionValidator = mockObject<TransactionValidator>({
          fetchTxAndDecode: mockFn().resolvesTo({
            isSuccess: false,
            controllerResult,
          }),
        })
        const controller = new TransactionSubmitController(
          transactionValidator,
          mockObject<SentTransactionRepository>(),
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: EthereumAddress.fake(),
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset
        )

        const result = await controller.submitForcedWithdrawalFreezeRequest(
          Hash256.fake()
        )

        expect(result).toEqual(controllerResult)
      })
    }
  )

  describe(
    TransactionSubmitController.prototype.submitForcedTradeFreezeRequest.name,
    () => {
      it('handles transaction with correct data and address', async () => {
        const decodedData = {
          starkKeyA: StarkKey.fake(),
          starkKeyB: StarkKey.fake(),
          positionIdA: 1234n,
          positionIdB: 1235n,
          collateralAssetId: AssetId('USDC-6'),
          syntheticAssetId: AssetId('BTC-10'),
          collateralAmount: 2222n,
          syntheticAmount: 3333n,
          isABuyingSynthetic: true,
          submissionExpirationTime: Timestamp(1234),
          nonce: 1n,
          signature: '0x1234',
          premiumCost: false,
        }
        const perpetualAddress = EthereumAddress.fake()
        const hash = Hash256.fake()

        const transactionValidator = mockObject<TransactionValidator>({
          fetchTxAndDecode: mockFn().resolvesTo({
            isSuccess: true,
            data: decodedData,
          }),
        })
        const repository = mockObject<SentTransactionRepository>({
          add: async () => hash,
        })
        const controller = new TransactionSubmitController(
          transactionValidator,
          repository,
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: perpetualAddress,
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset
        )

        const result = await controller.submitForcedTradeFreezeRequest(hash)

        expect(result).toEqual({
          type: 'created',
          content: { id: hash },
        })
        expect(transactionValidator.fetchTxAndDecode).toHaveBeenOnlyCalledWith(
          hash,
          perpetualAddress,
          expect.a(Function)
        )
        expect(repository.add).toHaveBeenOnlyCalledWith({
          transactionHash: hash,
          timestamp: expect.a(BigInt),
          data: {
            type: 'ForcedTradeFreezeRequest',
            ...decodedData,
          },
        })
      })

      it('handles transaction with incorrect data', async () => {
        const controllerResult = {
          type: 'bad request',
          message: 'Invalid transaction',
        } as const
        const transactionValidator = mockObject<TransactionValidator>({
          fetchTxAndDecode: mockFn().resolvesTo({
            isSuccess: false,
            controllerResult,
          }),
        })
        const controller = new TransactionSubmitController(
          transactionValidator,
          mockObject<SentTransactionRepository>(),
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: EthereumAddress.fake(),
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset
        )

        const result = await controller.submitForcedTradeFreezeRequest(
          Hash256.fake()
        )

        expect(result).toEqual(controllerResult)
      })
    }
  )

  describe(
    TransactionSubmitController.prototype.submitFullWithdrawalFreezeRequest
      .name,
    () => {
      it('handles transaction with correct data and address', async () => {
        const decodedData = {
          starkKey: StarkKey.fake(),
          vaultId: 1234n,
        }
        const perpetualAddress = EthereumAddress.fake()
        const hash = Hash256.fake()

        const transactionValidator = mockObject<TransactionValidator>({
          fetchTxAndDecode: mockFn().resolvesTo({
            isSuccess: true,
            data: decodedData,
          }),
        })
        const repository = mockObject<SentTransactionRepository>({
          add: async () => hash,
        })
        const controller = new TransactionSubmitController(
          transactionValidator,
          repository,
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: perpetualAddress,
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset
        )

        const result = await controller.submitFullWithdrawalFreezeRequest(hash)

        expect(result).toEqual({
          type: 'created',
          content: { id: hash },
        })
        expect(transactionValidator.fetchTxAndDecode).toHaveBeenOnlyCalledWith(
          hash,
          perpetualAddress,
          decodeFullWithdrawalFreezeRequest
        )
        expect(repository.add).toHaveBeenOnlyCalledWith({
          transactionHash: hash,
          timestamp: expect.a(BigInt),
          data: {
            type: 'FullWithdrawalFreezeRequest',
            starkKey: decodedData.starkKey,
            vaultId: decodedData.vaultId,
          },
        })
      })

      it('handles transaction with incorrect data', async () => {
        const controllerResult = {
          type: 'bad request',
          message: 'Invalid transaction',
        } as const
        const transactionValidator = mockObject<TransactionValidator>({
          fetchTxAndDecode: mockFn().resolvesTo({
            isSuccess: false,
            controllerResult,
          }),
        })
        const controller = new TransactionSubmitController(
          transactionValidator,
          mockObject<SentTransactionRepository>(),
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: EthereumAddress.fake(),
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset
        )

        const result = await controller.submitFullWithdrawalFreezeRequest(
          Hash256.fake()
        )

        expect(result).toEqual(controllerResult)
      })
    }
  )

  describe(
    TransactionSubmitController.prototype.submitFinalizeEscape.name,
    () => {
      it('handles transaction with correct data and address', async () => {
        const decodedData = {
          starkKey: StarkKey.fake(),
          positionOrVaultId: 1234n,
          quantizedAmount: 5000n,
        }
        const perpetualAddress = EthereumAddress.fake()
        const hash = Hash256.fake()

        const transactionValidator = mockObject<TransactionValidator>({
          fetchTxAndDecode: mockFn().resolvesTo({
            isSuccess: true,
            data: decodedData,
          }),
        })
        const repository = mockObject<SentTransactionRepository>({
          add: async () => hash,
        })
        const controller = new TransactionSubmitController(
          transactionValidator,
          repository,
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: perpetualAddress,
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset
        )

        const result = await controller.submitFinalizeEscape(hash)

        expect(result).toEqual({
          type: 'created',
          content: { id: hash },
        })
        expect(transactionValidator.fetchTxAndDecode).toHaveBeenOnlyCalledWith(
          hash,
          perpetualAddress,
          decodeFinalizeEscapeRequest
        )
        expect(repository.add).toHaveBeenOnlyCalledWith({
          transactionHash: hash,
          timestamp: expect.a(BigInt),
          data: {
            type: 'FinalizeEscape',
            starkKey: decodedData.starkKey,
            positionOrVaultId: decodedData.positionOrVaultId,
            quantizedAmount: decodedData.quantizedAmount,
          },
        })
      })

      it('handles transaction with incorrect data', async () => {
        const controllerResult = {
          type: 'bad request',
          message: 'Invalid transaction',
        } as const
        const transactionValidator = mockObject<TransactionValidator>({
          fetchTxAndDecode: mockFn().resolvesTo({
            isSuccess: false,
            controllerResult,
          }),
        })
        const controller = new TransactionSubmitController(
          transactionValidator,
          mockObject<SentTransactionRepository>(),
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: EthereumAddress.fake(),
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset
        )

        const result = await controller.submitFinalizeEscape(Hash256.fake())

        expect(result).toEqual(controllerResult)
      })
    }
  )
})

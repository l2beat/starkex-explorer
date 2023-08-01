import {
  encodeFreezeRequest,
  encodePerpetualForcedTradeRequest,
  encodePerpetualForcedWithdrawalRequest,
  encodeVerifyEscapeRequest,
  encodeWithdrawal,
} from '@explorer/shared'
import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect, mockObject } from 'earl'
import { providers } from 'ethers'
import { it } from 'mocha'

import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
import { SentTransactionRepository } from '../../peripherals/database/transactions/SentTransactionRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import {
  fakeAccepted,
  fakeCollateralAsset,
  fakeInitialOffer,
  fakeOffer,
} from '../../test/fakes'
import { TransactionSubmitController } from './TransactionSubmitController'

describe(TransactionSubmitController.name, () => {
  describe(TransactionSubmitController.prototype.submitForcedExit.name, () => {
    it('handles nonexistent transaction', async () => {
      const controller = new TransactionSubmitController(
        mockObject<EthereumClient>({
          getTransaction: async () => undefined,
        }),
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>(),
        {
          perpetual: EthereumAddress.fake(),
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset,
        false
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedExit(hash)

      expect(result).toEqual({
        type: 'bad request',
        message: `Transaction ${hash.toString()} not found`,
      })
    })

    it('handles transaction to a wrong address', async () => {
      const data = encodePerpetualForcedWithdrawalRequest({
        starkKey: StarkKey.fake(),
        positionId: 0n,
        quantizedAmount: 0n,
        premiumCost: false,
      })
      const controller = new TransactionSubmitController(
        mockObject<EthereumClient>({
          getTransaction: async () =>
            ({
              to: EthereumAddress.fake('b').toString(),
              data,
            } as providers.TransactionResponse),
        }),
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>(),
        {
          perpetual: EthereumAddress.fake(),
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedExit(hash)

      expect(result).toEqual({
        type: 'bad request',
        message: `Invalid transaction`,
      })
    })

    it('handles transaction with unknown data', async () => {
      const controller = new TransactionSubmitController(
        mockObject<EthereumClient>({
          getTransaction: async () =>
            ({
              to: EthereumAddress.fake('a').toString(),
              data: '0x1234',
            } as providers.TransactionResponse),
        }),
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>(),
        {
          perpetual: EthereumAddress.fake(),
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedExit(hash)

      expect(result).toEqual({
        type: 'bad request',
        message: `Invalid transaction`,
      })
    })

    it('handles transaction with correct data and address', async () => {
      const data = encodePerpetualForcedWithdrawalRequest({
        starkKey: StarkKey.fake(),
        positionId: 0n,
        quantizedAmount: 0n,
        premiumCost: false,
      })
      const perpetualAddress = EthereumAddress.fake()
      const hash = Hash256.fake()

      const repository = mockObject<SentTransactionRepository>({
        add: async () => hash,
      })
      const controller = new TransactionSubmitController(
        mockObject<EthereumClient>({
          getTransaction: async () =>
            ({
              to: perpetualAddress.toString(),
              data,
            } as providers.TransactionResponse),
        }),
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
    })
  })

  describe(TransactionSubmitController.prototype.submitForcedTrade.name, () => {
    it('handles nonexistent offer', async () => {
      const controller = new TransactionSubmitController(
        mockObject<EthereumClient>(),
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
        mockObject<EthereumClient>(),
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
        mockObject<EthereumClient>(),
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
        mockObject<EthereumClient>(),
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

    it('handles nonexistent transaction', async () => {
      const offer = fakeOffer()
      const controller = new TransactionSubmitController(
        mockObject<EthereumClient>({
          getTransaction: async () => undefined,
        }),
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>({ findById: async () => offer }),
        {
          perpetual: EthereumAddress.fake(),
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset,
        false
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedTrade(hash, offer.id)

      expect(result).toEqual({
        type: 'bad request',
        message: `Transaction ${hash.toString()} not found`,
      })
    })

    it('handles transaction to a wrong address', async () => {
      const data = encodePerpetualForcedTradeRequest(
        {
          starkKeyA: StarkKey.fake(),
          positionIdA: 0n,
          syntheticAssetId: AssetId('USDC-6'),
          collateralAmount: 0n,
          syntheticAmount: 0n,
          isABuyingSynthetic: false,
          nonce: 0n,
          signature: Hash256.fake().toString(),
          starkKeyB: StarkKey.fake(),
          positionIdB: 0n,
          submissionExpirationTime: Timestamp(0n),
          premiumCost: false,
        },
        fakeCollateralAsset
      )
      const offer = fakeOffer()
      const controller = new TransactionSubmitController(
        mockObject<EthereumClient>({
          getTransaction: async () =>
            ({
              to: EthereumAddress.fake('b').toString(),
              data,
            } as providers.TransactionResponse),
        }),
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
        message: `Invalid transaction`,
      })
    })

    it('handles transaction with unknown data', async () => {
      const accepted = fakeAccepted({ signature: Hash256.fake().toString() })
      const offer = fakeOffer({ accepted })
      const data = encodePerpetualForcedTradeRequest(
        {
          ...offer,
          ...accepted,
          starkKeyA: StarkKey.fake(),
        },
        fakeCollateralAsset
      )
      const perpetualAddress = EthereumAddress.fake()

      const controller = new TransactionSubmitController(
        mockObject<EthereumClient>({
          getTransaction: async () =>
            ({
              to: perpetualAddress.toString(),
              data,
            } as providers.TransactionResponse),
        }),
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>({ findById: async () => offer }),
        {
          perpetual: perpetualAddress,
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedTrade(hash, offer.id)

      expect(result).toEqual({
        type: 'bad request',
        message: `Invalid transaction`,
      })
    })

    it('handles transaction with correct data and address', async () => {
      const accepted = fakeAccepted({ signature: Hash256.fake().toString() })
      const offer = fakeOffer({ accepted })
      const data = encodePerpetualForcedTradeRequest(
        {
          ...offer,
          ...accepted,
        },
        fakeCollateralAsset
      )
      const perpetualAddress = EthereumAddress.fake()
      const hash = Hash256.fake()

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
        mockObject<EthereumClient>({
          getTransaction: async () =>
            ({
              to: perpetualAddress.toString(),
              data,
            } as providers.TransactionResponse),
        }),
        sentTransactionRepository,
        forcedTradeOfferRepository,
        {
          perpetual: perpetualAddress,
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const result = await controller.submitForcedTrade(hash, 1)

      expect(result).toEqual({
        type: 'created',
        content: { id: hash },
      })
    })
  })

  describe(TransactionSubmitController.prototype.submitWithdrawal.name, () => {
    it('handles nonexistent transaction', async () => {
      const controller = new TransactionSubmitController(
        mockObject<EthereumClient>({
          getTransaction: async () => undefined,
        }),
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>(),
        {
          perpetual: EthereumAddress.fake(),
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset,
        false
      )

      const finalizeHash = Hash256.fake()
      const result = await controller.submitWithdrawal(finalizeHash)

      expect(result).toEqual({
        type: 'bad request',
        message: `Transaction ${finalizeHash.toString()} not found`,
      })
    })

    it('handles transaction to a wrong address', async () => {
      const data = encodeWithdrawal({
        starkKey: StarkKey.fake(),
        assetTypeHash: AssetHash.fake(),
      })
      const controller = new TransactionSubmitController(
        mockObject<EthereumClient>({
          getTransaction: async () =>
            ({
              to: EthereumAddress.fake().toString(),
              data,
            } as providers.TransactionResponse),
        }),
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>(),
        {
          perpetual: EthereumAddress.fake(),
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const finalizeHash = Hash256.fake()
      const result = await controller.submitWithdrawal(finalizeHash)

      expect(result).toEqual({
        type: 'bad request',
        message: `Invalid transaction`,
      })
    })

    it('handles transaction with unknown data', async () => {
      const controller = new TransactionSubmitController(
        mockObject<EthereumClient>({
          getTransaction: async () =>
            ({
              to: EthereumAddress.fake('a').toString(),
              data: '0x1234',
            } as providers.TransactionResponse),
        }),
        mockObject<SentTransactionRepository>(),
        mockObject<ForcedTradeOfferRepository>(),
        {
          perpetual: EthereumAddress.fake(),
          escapeVerifier: EthereumAddress.fake(),
        },
        fakeCollateralAsset
      )

      const hash = Hash256.fake()
      const result = await controller.submitForcedExit(hash)

      expect(result).toEqual({
        type: 'bad request',
        message: `Invalid transaction`,
      })
    })

    it('handles transaction with correct data and address', async () => {
      const data = encodeWithdrawal({
        starkKey: StarkKey.fake(),
        assetTypeHash: AssetHash.fake(),
      })
      const perpetualAddress = EthereumAddress.fake()
      const hash = Hash256.fake()

      const repository = mockObject<SentTransactionRepository>({
        add: async (record) => record.transactionHash,
      })
      const controller = new TransactionSubmitController(
        mockObject<EthereumClient>({
          getTransaction: async () =>
            ({
              to: perpetualAddress.toString(),
              data,
            } as providers.TransactionResponse),
        }),
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
    })
  })

  describe(
    TransactionSubmitController.prototype.submitVerifyEscape.name,
    () => {
      it('handles nonexistent transaction', async () => {
        const controller = new TransactionSubmitController(
          mockObject<EthereumClient>({
            getTransaction: async () => undefined,
          }),
          mockObject<SentTransactionRepository>(),
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: EthereumAddress.fake(),
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset,
          false
        )

        const hash = Hash256.fake()
        const result = await controller.submitVerifyEscape(
          hash,
          StarkKey.fake(),
          123n
        )

        expect(result).toEqual({
          type: 'bad request',
          message: `Transaction ${hash.toString()} not found`,
        })
      })

      it('handles transaction to a wrong address', async () => {
        const controller = new TransactionSubmitController(
          mockObject<EthereumClient>({
            getTransaction: async () =>
              ({
                to: EthereumAddress.fake('b').toString(),
              } as providers.TransactionResponse),
          }),
          mockObject<SentTransactionRepository>(),
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: EthereumAddress.fake(),
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset
        )

        const hash = Hash256.fake()
        const result = await controller.submitVerifyEscape(
          hash,
          StarkKey.fake(),
          123n
        )

        expect(result).toEqual({
          type: 'bad request',
          message: `Invalid transaction`,
        })
      })

      it('handles transaction with correct data and address', async () => {
        const data = encodeVerifyEscapeRequest({
          serializedMerkleProof: [],
          serializedState: [],
          assetCount: 1,
        })
        const escapeVerifierAddress = EthereumAddress.fake()
        const hash = Hash256.fake()

        const repository = mockObject<SentTransactionRepository>({
          add: async () => hash,
        })
        const controller = new TransactionSubmitController(
          mockObject<EthereumClient>({
            getTransaction: async () =>
              ({
                to: escapeVerifierAddress.toString(),
                data,
              } as providers.TransactionResponse),
          }),
          repository,
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: EthereumAddress.fake(),
            escapeVerifier: escapeVerifierAddress,
          },
          fakeCollateralAsset
        )

        const result = await controller.submitVerifyEscape(
          hash,
          StarkKey.fake(),
          123n
        )

        expect(result).toEqual({
          type: 'created',
          content: { id: hash },
        })
      })
    }
  )

  describe(
    TransactionSubmitController.prototype.submitFreezeRequest.name,
    () => {
      it('handles nonexistent transaction', async () => {
        const controller = new TransactionSubmitController(
          mockObject<EthereumClient>({
            getTransaction: async () => undefined,
          }),
          mockObject<SentTransactionRepository>(),
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: EthereumAddress.fake(),
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset,
          false
        )

        const hash = Hash256.fake()
        const result = await controller.submitFreezeRequest(hash)

        expect(result).toEqual({
          type: 'bad request',
          message: `Transaction ${hash.toString()} not found`,
        })
      })

      it('handles transaction to a wrong address', async () => {
        const data = encodeFreezeRequest({
          starkKey: StarkKey.fake(),
          positionOrVaultId: 1234n,
          quantizedAmount: 5000n,
        })
        const controller = new TransactionSubmitController(
          mockObject<EthereumClient>({
            getTransaction: async () =>
              ({
                to: EthereumAddress.fake('b').toString(),
                data,
              } as providers.TransactionResponse),
          }),
          mockObject<SentTransactionRepository>(),
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: EthereumAddress.fake(),
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset
        )

        const hash = Hash256.fake()
        const result = await controller.submitFreezeRequest(hash)

        expect(result).toEqual({
          type: 'bad request',
          message: `Invalid transaction`,
        })
      })

      it('handles transaction with unknown data', async () => {
        const controller = new TransactionSubmitController(
          mockObject<EthereumClient>({
            getTransaction: async () =>
              ({
                to: EthereumAddress.fake('a').toString(),
                data: '0x1234',
              } as providers.TransactionResponse),
          }),
          mockObject<SentTransactionRepository>(),
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: EthereumAddress.fake(),
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset
        )

        const hash = Hash256.fake()
        const result = await controller.submitForcedExit(hash)

        expect(result).toEqual({
          type: 'bad request',
          message: `Invalid transaction`,
        })
      })
      it('handles transaction with correct data and address', async () => {
        const data = encodeFreezeRequest({
          starkKey: StarkKey.fake(),
          positionOrVaultId: 1234n,
          quantizedAmount: 5000n,
        })
        const perpetualAddress = EthereumAddress.fake()
        const hash = Hash256.fake()

        const repository = mockObject<SentTransactionRepository>({
          add: async () => hash,
        })
        const controller = new TransactionSubmitController(
          mockObject<EthereumClient>({
            getTransaction: async () =>
              ({
                to: perpetualAddress.toString(),
                data,
              } as providers.TransactionResponse),
          }),
          repository,
          mockObject<ForcedTradeOfferRepository>(),
          {
            perpetual: perpetualAddress,
            escapeVerifier: EthereumAddress.fake(),
          },
          fakeCollateralAsset
        )

        const result = await controller.submitFreezeRequest(hash)

        expect(result).toEqual({
          type: 'created',
          content: { id: hash },
        })
      })
    }
  )
})

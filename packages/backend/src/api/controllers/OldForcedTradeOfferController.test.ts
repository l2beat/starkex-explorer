import { toSignableCancelOffer, toSignableCreateOffer } from '@explorer/shared'
import { AssetId, EthereumAddress, Hash256, Timestamp } from '@explorer/types'
import { expect, mockObject } from 'earljs'
import { Wallet } from 'ethers'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { AccountService } from '../../core/AccountService'
import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { fakeAccepted, fakeOffer } from '../../test/fakes'
import { OldForcedTradeOfferController } from './OldForcedTradeOfferController'
import * as tradeMock from './utils/ForcedTradeOfferMockData'

describe(OldForcedTradeOfferController.name, () => {
  const stateUpdateId = 1
  const positionA = {
    positionId: tradeMock.offer.positionIdA,
    starkKey: tradeMock.offer.starkKeyA,
    collateralBalance: tradeMock.offer.collateralAmount,
    balances: [],
    stateUpdateId,
  }
  const collateralAsset: CollateralAsset = {
    assetId: AssetId('USDC-6'),
    price: 1n,
  }
  const positionB = {
    starkKey: tradeMock.accepted.starkKeyB,
    positionId: tradeMock.accepted.positionIdB,
    collateralBalance: 0n,
    balances: [
      {
        assetId: tradeMock.offer.syntheticAssetId,
        balance: tradeMock.offer.syntheticAmount,
      },
    ],
    stateUpdateId,
  }
  const wallet = Wallet.createRandom()
  const addressA = EthereumAddress(wallet.address)
  const userA = {
    id: 1,
    blockNumber: 1,
    starkKey: tradeMock.offer.starkKeyA,
    ethAddress: addressA,
  }
  const userB = {
    id: 2,
    blockNumber: 1,
    starkKey: tradeMock.accepted.starkKeyB,
    ethAddress: tradeMock.addressB,
  }
  const invalidSignature = '0x12345'

  const mockAccountService = mockObject<AccountService>({
    getAccount: async (address) =>
      address
        ? {
            address: address,
            positionId: 123n,
            hasUpdates: false,
          }
        : undefined,
  })

  describe(
    OldForcedTradeOfferController.prototype.getOfferDetailsPage.name,
    () => {
      it('redirects to transaction page after submission', async () => {
        const offer = fakeOffer({
          accepted: fakeAccepted({ transactionHash: Hash256.fake() }),
        })
        const offerRepository = mockObject<ForcedTradeOfferRepository>({
          findById: async () => offer,
        })
        const controller = new OldForcedTradeOfferController(
          mockAccountService,
          offerRepository,
          mockObject<PositionRepository>(),
          mockObject<UserRegistrationEventRepository>(),
          collateralAsset,
          EthereumAddress.fake()
        )

        expect(
          await controller.getOfferDetailsPage(offer.id, undefined)
        ).toEqual({
          type: 'redirect',
          url: `/forced/${offer.accepted?.transactionHash?.toString() ?? ''}`,
        })
      })
    }
  )

  describe(OldForcedTradeOfferController.prototype.postOffer.name, () => {
    it('blocks invalid signature', async () => {
      const offerRepository = mockObject<ForcedTradeOfferRepository>({
        add: async () => 1,
      })
      const positionRepository = mockObject<PositionRepository>({
        findById: async () => positionA,
      })
      const userRegistrationEventRepository =
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        })
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        offerRepository,
        positionRepository,
        userRegistrationEventRepository,
        collateralAsset,
        EthereumAddress.fake()
      )

      expect(
        await controller.postOffer(tradeMock.offer, invalidSignature)
      ).toEqual({
        type: 'bad request',
        content: 'Your offer is invalid.',
      })
    })

    it('blocks missing position', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>(),
        mockObject<PositionRepository>({
          findById: async () => undefined,
        }),
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        collateralAsset,
        EthereumAddress.fake()
      )

      expect(
        await controller.postOffer(tradeMock.offer, invalidSignature)
      ).toEqual({
        type: 'not found',
        content: 'Position does not exist.',
      })
    })

    it('blocks missing user', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>(),
        mockObject<PositionRepository>({
          findById: async () => positionA,
        }),
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async () => undefined,
        }),
        collateralAsset,
        EthereumAddress.fake()
      )

      expect(
        await controller.postOffer(tradeMock.offer, invalidSignature)
      ).toEqual({
        type: 'not found',
        content: 'Position does not exist.',
      })
    })

    it('blocks invalid balance', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>(),
        mockObject<PositionRepository>({
          findById: async () => ({ ...positionA, collateralAmount: 0n }),
        }),
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        collateralAsset,
        EthereumAddress.fake()
      )

      expect(
        await controller.postOffer(tradeMock.offer, invalidSignature)
      ).toEqual({
        type: 'bad request',
        content: 'Your offer is invalid.',
      })
    })

    it('creates offer', async () => {
      const id = 1
      const offerRepository = mockObject<ForcedTradeOfferRepository>({
        add: async () => id,
      })
      const positionRepository = mockObject<PositionRepository>({
        findById: async () => positionA,
      })
      const userRegistrationEventRepository =
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        })
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        offerRepository,
        positionRepository,
        userRegistrationEventRepository,
        collateralAsset,
        EthereumAddress.fake()
      )

      const request = toSignableCreateOffer(tradeMock.offer)
      const signature = await wallet.signMessage(request)
      expect(await controller.postOffer(tradeMock.offer, signature)).toEqual({
        type: 'created',
        content: { id },
      })
    })
  })

  describe(OldForcedTradeOfferController.prototype.acceptOffer.name, () => {
    it('blocks missing position', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>(),
        mockObject<PositionRepository>({
          findById: async () => undefined,
        }),
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        collateralAsset,
        EthereumAddress.fake()
      )

      expect(await controller.acceptOffer(1, tradeMock.accepted)).toEqual({
        type: 'not found',
        content: 'Position does not exist.',
      })
    })

    it('blocks missing user', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>(),
        mockObject<PositionRepository>({
          findById: async () => positionA,
        }),
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async () => undefined,
        }),
        collateralAsset,
        EthereumAddress.fake()
      )

      expect(await controller.acceptOffer(1, tradeMock.accepted)).toEqual({
        type: 'not found',
        content: 'Position does not exist.',
      })
    })

    it('blocks missing offer', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>({
          findById: async () => undefined,
        }),
        mockObject<PositionRepository>({
          findById: async () => positionA,
        }),
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        collateralAsset,
        EthereumAddress.fake()
      )

      expect(await controller.acceptOffer(1, tradeMock.accepted)).toEqual({
        type: 'not found',
        content: 'Offer does not exist.',
      })
    })

    it('blocks accepted offer', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>({
          findById: async () => ({
            id: 1,
            createdAt: Timestamp(Date.now() - 2000),
            ...tradeMock.offer,
            accepted: {
              ...tradeMock.accepted,
              at: Timestamp(Date.now() - 1000),
            },
          }),
        }),
        mockObject<PositionRepository>({
          findById: async () => positionA,
        }),
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        collateralAsset,
        EthereumAddress.fake()
      )

      expect(await controller.acceptOffer(1, tradeMock.accepted)).toEqual({
        type: 'bad request',
        content: 'Offer already accepted.',
      })
    })

    it('blocks cancelled offer', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>({
          findById: async () => ({
            id: 1,
            createdAt: Timestamp(Date.now() - 2000),
            ...tradeMock.offer,
            cancelledAt: Timestamp(Date.now() - 1000),
          }),
        }),
        mockObject<PositionRepository>({
          findById: async () => positionA,
        }),
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        collateralAsset,
        EthereumAddress.fake()
      )

      expect(await controller.acceptOffer(1, tradeMock.accepted)).toEqual({
        type: 'bad request',
        content: 'Offer already cancelled.',
      })
    })

    it('blocks invalid signature', async () => {
      const id = 1
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>({
          add: async () => id,
          findById: async () => ({
            ...tradeMock.offer,
            id,
            createdAt: Timestamp.now(),
          }),
        }),
        mockObject<PositionRepository>({
          findById: async (id) => {
            if (id === positionA.positionId) {
              return positionA
            }
            if (id === positionB.positionId) {
              return { ...positionB, balances: [] }
            }
          },
        }),
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async (starkKey) => {
            if (starkKey === userA.starkKey) {
              return userA
            }
            if (starkKey === userB.starkKey) {
              return userB
            }
          },
        }),
        collateralAsset,
        EthereumAddress.fake()
      )

      expect(
        await controller.acceptOffer(id, {
          ...tradeMock.accepted,
          signature: 'invalid',
        })
      ).toEqual({
        type: 'bad request',
        content: 'Invalid signature.',
      })
    })

    it('accepts offer', async () => {
      const id = 1
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>({
          add: async () => id,
          findById: async () => ({
            id,
            createdAt: Timestamp.now(),
            ...tradeMock.offer,
          }),
          update: async () => 1,
        }),
        mockObject<PositionRepository>({
          findById: async (id) => {
            if (id === positionA.positionId) {
              return positionA
            }
            if (id === positionB.positionId) {
              return positionB
            }
          },
        }),
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async (starkKey) => {
            if (starkKey === userA.starkKey) {
              return userA
            }
            if (starkKey === userB.starkKey) {
              return userB
            }
          },
        }),
        collateralAsset,
        EthereumAddress.fake()
      )

      expect(await controller.acceptOffer(id, tradeMock.accepted)).toEqual({
        type: 'success',
        content: 'Accept offer was submitted.',
      })
    })
  })

  describe(OldForcedTradeOfferController.prototype.cancelOffer.name, () => {
    const id = 1
    const request = toSignableCancelOffer(id)
    const initial = {
      id,
      ...tradeMock.offer,
      createdAt: Timestamp(Date.now() - 1000),
      accepted: undefined,
    }
    const accepted = {
      ...initial,
      accepted: {
        ...tradeMock.accepted,
        at: Timestamp(Date.now() - 500),
      },
    }

    it('blocks missing offer', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>({
          findById: async () => undefined,
        }),
        mockObject<PositionRepository>(),
        mockObject<UserRegistrationEventRepository>(),
        collateralAsset,
        EthereumAddress.fake()
      )

      expect(await controller.cancelOffer(1, '123')).toEqual({
        type: 'not found',
        content: 'Offer does not exist.',
      })
    })

    it('blocks cancelled offer', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>({
          findById: async () => ({
            ...initial,
            cancelledAt: Timestamp.now(),
          }),
        }),
        mockObject<PositionRepository>(),
        mockObject<UserRegistrationEventRepository>(),
        collateralAsset,
        EthereumAddress.fake()
      )

      const signature = await wallet.signMessage(request)
      expect(await controller.cancelOffer(id, signature)).toEqual({
        type: 'bad request',
        content: 'Offer already cancelled.',
      })
    })

    it('blocks submitted offer', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>({
          findById: async () => ({
            ...accepted,
            accepted: {
              ...accepted.accepted,
              transactionHash: Hash256.fake(),
            },
          }),
        }),
        mockObject<PositionRepository>(),
        mockObject<UserRegistrationEventRepository>(),
        collateralAsset,
        EthereumAddress.fake()
      )

      const signature = await wallet.signMessage(request)
      expect(await controller.cancelOffer(id, signature)).toEqual({
        type: 'bad request',
        content: 'Offer already submitted.',
      })
    })

    it('blocks missing position', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>({
          findById: async () => accepted,
        }),
        mockObject<PositionRepository>(),
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async () => undefined,
        }),
        collateralAsset,
        EthereumAddress.fake()
      )

      const signature = await wallet.signMessage(request)
      expect(await controller.cancelOffer(id, signature)).toEqual({
        type: 'not found',
        content: 'Position does not exist.',
      })
    })

    it('blocks invalid signature', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>({
          findById: async () => accepted,
        }),
        mockObject<PositionRepository>(),
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async () => userA,
        }),
        collateralAsset,
        EthereumAddress.fake()
      )

      const signature = await wallet.signMessage(request + 'tampered')
      expect(await controller.cancelOffer(id, signature)).toEqual({
        type: 'bad request',
        content: 'Signature does not match.',
      })
    })

    it('cancels offer', async () => {
      const controller = new OldForcedTradeOfferController(
        mockAccountService,
        mockObject<ForcedTradeOfferRepository>({
          findById: async () => accepted,
          update: async () => 1,
        }),
        mockObject<PositionRepository>(),
        mockObject<UserRegistrationEventRepository>({
          findByStarkKey: async () => ({
            ...userA,
            ethAddress: addressA,
          }),
        }),
        collateralAsset,
        EthereumAddress.fake()
      )
      const signature = await wallet.signMessage(request)

      expect(await controller.cancelOffer(id, signature)).toEqual({
        type: 'success',
        content: 'Offer cancelled.',
      })
    })
  })
})

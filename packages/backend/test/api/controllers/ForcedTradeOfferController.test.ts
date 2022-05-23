import {
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'
import { expect } from 'earljs'

import {
  ForcedTradeOfferController,
  validateAcceptedSignature,
  validateInitialSignature,
} from '../../../src/api/controllers/ForcedTradeOfferController'
import {
  Accepted,
  ForcedTradeOfferRecord,
  ForcedTradeOfferRepository,
} from '../../../src/peripherals/database/ForcedTradeOfferRepository'
import { PositionRepository } from '../../../src/peripherals/database/PositionRepository'
import { UserRegistrationEventRepository } from '../../../src/peripherals/database/UserRegistrationEventRepository'
import { mock } from '../../mock'

// Mock data taken from real transaction:https://etherscan.io/tx/0x9b2dce5538d0c8c08511c9383be9b67da6f952b367baff0c8bdb5f66c9395634

const initialOffer: Omit<ForcedTradeOfferRecord, 'createdAt' | 'id'> = {
  starkKeyA: StarkKey(
    '05733b2b5e71223285e7966386a4e81d3c55480782af122227cf7d1b0b08c32e'
  ),
  positionIdA: BigInt('0x205'),
  syntheticAssetId: AssetId('AAVE-8'),
  amountCollateral: BigInt('0x684ee1800'),
  amountSynthetic: BigInt('0xf4240'),
  aIsBuyingSynthetic: true,
}

const acceptedData: Omit<Accepted, 'at'> = {
  starkKeyB: StarkKey(
    '069913f789acdd07ff1aff8aa5dcf3d4935cf1d8b29d0f41839cd1be52dc4a41'
  ),
  positionIdB: BigInt('0x2ce'),
  submissionExpirationTime: 3456000000000n,
  nonce: BigInt(38404830),
  premiumCost: true,
  signature:
    '0x1bb089c2686c65d8d2e5800761b2826e0fc1f68f7e228fc161384958222bbc271458f40ed77507d59ca77c56204b0134b429eaface39b196d1f07e917a14c7641b',
}

const expectedEthAddress = EthereumAddress(
  '0xCE9a3e51B905997F1D098345a92B6c749A1f72B9'
)

describe(validateAcceptedSignature.name, () => {
  it('decodes example tx', () => {
    expect(
      validateAcceptedSignature(initialOffer, acceptedData, expectedEthAddress)
    ).toBeTruthy()
  })
})

describe(validateInitialSignature.name, () => {
  const starkKeyA = StarkKey(
    '0x0d06c518b04d2606f57fb8b54dcc1e3053928da108055a5c69ef39011afd47e7'
  )

  const INITIAL_OFFER = {
    starkKeyA,
    positionIdA: 1234n,
    syntheticAssetId: AssetId('BTC-10'),
    amountCollateral: 20359763977n,
    amountSynthetic: 5287654321n,
    aIsBuyingSynthetic: true,
  }
  const ETH_ADDRESS = EthereumAddress(
    '0x6235538E538067Db89E72d24F4D1a757E234Bed1'
  )

  const SIGNATURE =
    '0x566e6942c5f7c88cf644a93a78f9ebe614a33d0f0254a8d56b9f4f77b1228f194fa533f1bd3589b2816f1575abb99b7087956840ff0bf631c65f2df2bd37ef9a1c'

  it('decodes example message', () => {
    expect(
      validateInitialSignature(INITIAL_OFFER, SIGNATURE, ETH_ADDRESS)
    ).toBeTruthy()
  })
})

describe(ForcedTradeOfferController.name, () => {
  describe(ForcedTradeOfferController.prototype.postOffer.name, () => {
    const starkKeyA = StarkKey(
      '0x0d06c518b04d2606f57fb8b54dcc1e3053928da108055a5c69ef39011afd47e7'
    )

    const INITIAL_OFFER = {
      starkKeyA,
      positionIdA: 1234n,
      syntheticAssetId: AssetId('BTC-10'),
      amountCollateral: 20359763977n,
      amountSynthetic: 5287654321n,
      aIsBuyingSynthetic: true,
    }

    const POSITION_A = {
      positionId: 1234n,
      publicKey: starkKeyA,
      collateralBalance: 20359763977n,
      balances: [],
      stateUpdateId: 1,
    }

    const REGISTRATION_EVENT_A = {
      id: 1,
      blockNumber: 1,
      starkKey: starkKeyA,
      ethAddress: EthereumAddress('0x6235538E538067Db89E72d24F4D1a757E234Bed1'),
    }

    const SIGNATURE =
      '0x566e6942c5f7c88cf644a93a78f9ebe614a33d0f0254a8d56b9f4f77b1228f194fa533f1bd3589b2816f1575abb99b7087956840ff0bf631c65f2df2bd37ef9a1c'

    const FAKE_SIGNATURE =
      '0xf377b79e3c3e1d9674a6f6153c388218c8ac31a8be38d77a8b74accdc332599a4cbd2abdb9f9dc81260540b86c8daf66380283a9f70ebceb2097c0db20ec243c1c'

    it('happy path', async () => {
      const offerRepository = mock<ForcedTradeOfferRepository>({
        add: async () => 1,
      })
      const positionRepository = mock<PositionRepository>({
        findById: async () => POSITION_A,
      })
      const userRegistrationEventRepository =
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => REGISTRATION_EVENT_A,
        })
      const controller = new ForcedTradeOfferController(
        offerRepository,
        positionRepository,
        userRegistrationEventRepository
      )

      expect(await controller.postOffer(INITIAL_OFFER, SIGNATURE)).toEqual({
        type: 'created',
        content: { id: 1 },
      })
    })
    it('returns bad request when signature not valid', async () => {
      const offerRepository = mock<ForcedTradeOfferRepository>({
        add: async () => 1,
      })
      const positionRepository = mock<PositionRepository>({
        findById: async () => POSITION_A,
      })
      const userRegistrationEventRepository =
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => REGISTRATION_EVENT_A,
        })
      const controller = new ForcedTradeOfferController(
        offerRepository,
        positionRepository,
        userRegistrationEventRepository
      )

      expect(await controller.postOffer(INITIAL_OFFER, FAKE_SIGNATURE)).toEqual(
        {
          type: 'bad request',
          content: 'Your offer is invalid.',
        }
      )
    })
    it('returns not found when position does not exist', async () => {
      const controller = new ForcedTradeOfferController(
        mock<ForcedTradeOfferRepository>(),
        mock<PositionRepository>({
          findById: async () => undefined,
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => REGISTRATION_EVENT_A,
        })
      )

      expect(await controller.postOffer(INITIAL_OFFER, FAKE_SIGNATURE)).toEqual(
        {
          type: 'not found',
          content: 'Position does not exist.',
        }
      )
    })
    it('returns not found when user not registered', async () => {
      const controller = new ForcedTradeOfferController(
        mock<ForcedTradeOfferRepository>(),
        mock<PositionRepository>({
          findById: async () => POSITION_A,
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => undefined,
        })
      )

      expect(await controller.postOffer(INITIAL_OFFER, FAKE_SIGNATURE)).toEqual(
        {
          type: 'not found',
          content: 'Position does not exist.',
        }
      )
    })
    it('returns bad request when balance invalid', async () => {
      const controller = new ForcedTradeOfferController(
        mock<ForcedTradeOfferRepository>(),
        mock<PositionRepository>({
          findById: async () => ({ ...POSITION_A, amountCollateral: 0n }),
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => REGISTRATION_EVENT_A,
        })
      )

      expect(await controller.postOffer(INITIAL_OFFER, FAKE_SIGNATURE)).toEqual(
        {
          type: 'bad request',
          content: 'Your offer is invalid.',
        }
      )
    })
  })

  describe(ForcedTradeOfferController.prototype.acceptOffer.name, () => {
    const starkKeyA = StarkKey(
      '05733b2b5e71223285e7966386a4e81d3c55480782af122227cf7d1b0b08c32e'
    )
    const starkKeyB = StarkKey(
      '069913f789acdd07ff1aff8aa5dcf3d4935cf1d8b29d0f41839cd1be52dc4a41'
    )

    const POSITION_A = {
      publicKey: starkKeyA,
      positionId: 517n,
      collateralBalance: 28000000000n,
      balances: [],
      stateUpdateId: 1,
    }
    const POSITION_B = {
      publicKey: starkKeyB,
      positionId: 718n,
      collateralBalance: 0n,
      balances: [{ assetId: AssetId('AAVE-8'), balance: 1000000n }],
      stateUpdateId: 1,
    }

    const REGISTRATION_EVENT_A = {
      id: 1,
      blockNumber: 1,
      starkKey: starkKeyA,
      ethAddress: EthereumAddress('0x6235538E538067Db89E72d24F4D1a757E234Bed1'),
    }

    const REGISTRATION_EVENT_B = {
      id: 1,
      blockNumber: 1,
      starkKey: starkKeyB,
      ethAddress: EthereumAddress('0xCE9a3e51B905997F1D098345a92B6c749A1f72B9'),
    }

    const INITIAL_OFFER = {
      id: 1,
      createdAt: Timestamp(Date.now()),
      starkKeyA: starkKeyA,
      positionIdA: 517n,
      syntheticAssetId: AssetId('AAVE-8'),
      amountCollateral: BigInt('0x684ee1800'),
      amountSynthetic: BigInt('0xf4240'),
      aIsBuyingSynthetic: true,
    }

    it('happy path', async () => {
      const controller = new ForcedTradeOfferController(
        mock<ForcedTradeOfferRepository>({
          add: async () => 1,
          findById: async () => INITIAL_OFFER,
          save: async () => true,
        }),
        mock<PositionRepository>({
          findById: async (id) => {
            if (id === 517n) {
              return POSITION_A
            }
            if (id === 718n) {
              return POSITION_B
            }
          },
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async (starkKey) => {
            if (starkKey === starkKeyA) {
              return REGISTRATION_EVENT_A
            }
            if (starkKey === starkKeyB) {
              return REGISTRATION_EVENT_B
            }
          },
        })
      )

      expect(await controller.acceptOffer(1, acceptedData)).toEqual({
        type: 'success',
        content: 'Accept offer was submitted.',
      })
    })
    it('returns not found when position does not exist', async () => {
      const controller = new ForcedTradeOfferController(
        mock<ForcedTradeOfferRepository>({}),
        mock<PositionRepository>({
          findById: async (id) => {
            if (id === 517n) {
              return POSITION_A
            }
            if (id === 718n) {
              return POSITION_B
            }
          },
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => undefined,
        })
      )

      expect(await controller.acceptOffer(1, acceptedData)).toEqual({
        type: 'not found',
        content: 'Position does not exist.',
      })
    })
    it('returns not found when user not registered ', async () => {
      const controller = new ForcedTradeOfferController(
        mock<ForcedTradeOfferRepository>({}),
        mock<PositionRepository>({
          findById: async () => undefined,
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async (starkKey) => {
            if (starkKey === starkKeyA) {
              return REGISTRATION_EVENT_A
            }
            if (starkKey === starkKeyB) {
              return REGISTRATION_EVENT_B
            }
          },
        })
      )

      expect(await controller.acceptOffer(1, acceptedData)).toEqual({
        type: 'not found',
        content: 'Position does not exist.',
      })
    })
    it('return not found when initialOffer not found', async () => {
      const controller = new ForcedTradeOfferController(
        mock<ForcedTradeOfferRepository>({
          findById: async () => undefined,
        }),
        mock<PositionRepository>({
          findById: async (id) => {
            if (id === 517n) {
              return POSITION_A
            }
            if (id === 718n) {
              return POSITION_B
            }
          },
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async (starkKey) => {
            if (starkKey === starkKeyA) {
              return REGISTRATION_EVENT_A
            }
            if (starkKey === starkKeyB) {
              return REGISTRATION_EVENT_B
            }
          },
        })
      )

      expect(await controller.acceptOffer(1, acceptedData)).toEqual({
        type: 'not found',
        content: 'Offer does not exist.',
      })
    })
    it('return bad request when balance invalid', async () => {
      const controller = new ForcedTradeOfferController(
        mock<ForcedTradeOfferRepository>({
          add: async () => 1,
          findById: async () => INITIAL_OFFER,
        }),
        mock<PositionRepository>({
          findById: async (id) => {
            if (id === 517n) {
              return POSITION_A
            }
            if (id === 718n) {
              return { ...POSITION_B, balances: [] }
            }
          },
        }),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async (starkKey) => {
            if (starkKey === starkKeyA) {
              return REGISTRATION_EVENT_A
            }
            if (starkKey === starkKeyB) {
              return REGISTRATION_EVENT_B
            }
          },
        })
      )

      expect(await controller.acceptOffer(1, acceptedData)).toEqual({
        type: 'bad request',
        content: 'Your offer is invalid.',
      })
    })
  })

  describe(ForcedTradeOfferController.prototype.cancelOffer.name, () => {
    it('blocks missing offer', async () => {
      const controller = new ForcedTradeOfferController(
        mock<ForcedTradeOfferRepository>({
          findById: async () => undefined,
        }),
        mock<PositionRepository>(),
        mock<UserRegistrationEventRepository>()
      )

      expect(await controller.cancelOffer(1, '123')).toEqual({
        type: 'not found',
        content: 'Offer does not exist.',
      })
    })

    it('blocks cancelled offer', async () => {
      const controller = new ForcedTradeOfferController(
        mock<ForcedTradeOfferRepository>({
          findById: async () => ({
            ...initialOffer,
            id: 1,
            accepted: undefined,
            createdAt: Timestamp(Date.now() - 1000),
            cancelledAt: Timestamp(Date.now()),
          }),
        }),
        mock<PositionRepository>(),
        mock<UserRegistrationEventRepository>()
      )

      expect(await controller.cancelOffer(1, '123')).toEqual({
        type: 'bad request',
        content: 'Offer already cancelled.',
      })
    })

    it('blocks submitted offer', async () => {
      const controller = new ForcedTradeOfferController(
        mock<ForcedTradeOfferRepository>({
          findById: async () => ({
            ...initialOffer,
            id: 1,
            createdAt: Timestamp(Date.now() - 1000),
            accepted: {
              ...acceptedData,
              at: Timestamp(Date.now() - 500),
              transactionHash: Hash256.fake(),
            },
          }),
        }),
        mock<PositionRepository>(),
        mock<UserRegistrationEventRepository>()
      )

      expect(await controller.cancelOffer(1, '123')).toEqual({
        type: 'bad request',
        content: 'Offer already submitted.',
      })
    })

    it('blocks missing position', async () => {
      const controller = new ForcedTradeOfferController(
        mock<ForcedTradeOfferRepository>({
          findById: async () => ({
            ...initialOffer,
            id: 1,
            createdAt: Timestamp(Date.now() - 1000),
            accepted: {
              ...acceptedData,
              at: Timestamp(Date.now() - 500),
            },
          }),
        }),
        mock<PositionRepository>(),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => undefined,
        })
      )

      expect(await controller.cancelOffer(1, '123')).toEqual({
        type: 'not found',
        content: 'Position does not exist.',
      })
    })

    it('blocks invalid signature', async () => {
      const controller = new ForcedTradeOfferController(
        mock<ForcedTradeOfferRepository>({
          findById: async () => ({
            ...initialOffer,
            id: 1,
            createdAt: Timestamp(Date.now() - 1000),
            accepted: {
              ...acceptedData,
              at: Timestamp(Date.now() - 500),
            },
          }),
        }),
        mock<PositionRepository>(),
        mock<UserRegistrationEventRepository>({
          findByStarkKey: async () => ({
            id: 1,
            blockNumber: 1,
            starkKey: initialOffer.starkKeyA,
            ethAddress: EthereumAddress(
              '0x6235538E538067Db89E72d24F4D1a757E234Bed1'
            ),
          }),
        })
      )

      expect(await controller.cancelOffer(1, '123')).toEqual({
        type: 'bad request',
        content: 'Signature does not match.',
      })
    })
  })
})

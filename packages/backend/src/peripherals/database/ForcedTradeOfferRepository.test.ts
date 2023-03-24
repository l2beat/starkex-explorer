import { AssetId, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import { setupDatabaseTestSuite } from '../../test/database'
import {
  fakeAccepted,
  fakeBigInt,
  fakeInitialOffer,
  fakeOffer,
  fakeTimestamp,
} from '../../test/fakes'
import { Logger } from '../../tools/Logger'
import { ForcedTradeOfferRepository } from './ForcedTradeOfferRepository'

describe(ForcedTradeOfferRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new ForcedTradeOfferRepository(database, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  describe(ForcedTradeOfferRepository.prototype.add.name, () => {
    it('adds initial offer', async () => {
      const offer = fakeInitialOffer({ id: undefined })
      const id = await repository.add(offer)
      const actual = await repository.findById(id)
      expect(actual).toEqual({ ...offer, id })
    })
  })

  describe(ForcedTradeOfferRepository.prototype.update.name, () => {
    it('saves accepted offer', async () => {
      const initial = fakeInitialOffer({ id: undefined })
      const id = await repository.add(initial)
      const accepted = {
        ...initial,
        id,
        accepted: fakeAccepted(),
      }
      const updated = await repository.update(accepted)
      expect(updated).toEqual(1)

      const actual = await repository.findById(id)

      expect(actual).toEqual(accepted)
    })

    it('saves submitted offer', async () => {
      const initial = fakeInitialOffer({ id: undefined })
      const id = await repository.add(initial)
      const submitted = {
        ...initial,
        id,
        accepted: {
          ...fakeAccepted(),
          transactionHash: Hash256.fake(),
        },
      }
      const updated = await repository.update(submitted)
      expect(updated).toEqual(1)

      const actual = await repository.findById(id)

      expect(actual).toEqual(submitted)
    })
  })

  describe(
    ForcedTradeOfferRepository.prototype.updateTransactionHash.name,
    () => {
      it('updates the transaction hash', async () => {
        const initial = fakeInitialOffer({ id: undefined })
        const submitted = {
          ...initial,
          accepted: fakeAccepted(),
        }
        const id = await repository.add(submitted)

        const before = await repository.findById(id)
        expect(before?.accepted?.transactionHash).toEqual(undefined)

        const hash = Hash256.fake()
        await repository.updateTransactionHash(id, hash)

        const after = await repository.findById(id)
        expect(after?.accepted?.transactionHash).toEqual(hash)
      })
    }
  )

  async function seedInitialOffers() {
    const id1 = await repository.add(
      fakeInitialOffer({
        syntheticAssetId: AssetId('BTC-10'),
        isABuyingSynthetic: true,
        createdAt: Timestamp(1),
      })
    )
    const id2 = await repository.add(
      fakeInitialOffer({
        syntheticAssetId: AssetId('ETH-9'),
        isABuyingSynthetic: false,
        createdAt: Timestamp(2),
      })
    )
    const id3 = await repository.add(
      fakeInitialOffer({
        syntheticAssetId: AssetId('AAVE-8'),
        isABuyingSynthetic: false,
        createdAt: Timestamp(3),
      })
    )
    const id4 = await repository.add(
      fakeInitialOffer({
        syntheticAssetId: AssetId('AAVE-8'),
        isABuyingSynthetic: true,
        createdAt: Timestamp(4),
      })
    )
    const initial = fakeInitialOffer({
      createdAt: Timestamp(5),
    })
    const id5 = await repository.add(initial)
    await repository.update({ ...initial, id: id5, accepted: fakeAccepted() })

    return { id1, id2, id3, id4, id5 }
  }

  async function getIdsAndTotal({
    limit,
    offset,
    assetId,
    type,
  }: {
    limit: number
    offset: number
    assetId?: AssetId
    type?: 'buy' | 'sell'
  }) {
    return Promise.all([
      repository.countInitial({ type, assetId }),
      repository
        .getInitial({ limit, offset, assetId, type })
        .then((os) => os.map((o) => o.id)),
    ])
  }

  it('returns initial offers without filters', async () => {
    const { id1, id2, id3, id4 } = await seedInitialOffers()
    expect(await getIdsAndTotal({ limit: 10, offset: 0 })).toEqual([
      4,
      [id4, id3, id2, id1],
    ])
  })

  it('returns initial offers filtered by asset id', async () => {
    const { id2, id3, id4 } = await seedInitialOffers()
    expect(
      await getIdsAndTotal({ limit: 10, offset: 0, assetId: AssetId('AAVE-8') })
    ).toEqual([2, [id4, id3]])
    expect(
      await getIdsAndTotal({ limit: 10, offset: 0, assetId: AssetId('ETH-9') })
    ).toEqual([1, [id2]])
  })

  it('returns initial offers filtered by type', async () => {
    const { id1, id2, id3, id4 } = await seedInitialOffers()
    expect(
      await getIdsAndTotal({ limit: 10, offset: 0, type: 'sell' })
    ).toEqual([2, [id3, id2]])
    expect(await getIdsAndTotal({ limit: 10, offset: 0, type: 'buy' })).toEqual(
      [2, [id4, id1]]
    )
  })

  it('returns initial offers filtered by asset id and type', async () => {
    const { id4 } = await seedInitialOffers()
    expect(
      await getIdsAndTotal({
        limit: 10,
        offset: 0,
        assetId: AssetId('AAVE-8'),
        type: 'buy',
      })
    ).toEqual([1, [id4]])
  })

  it('returns initial offers filtered and paginated', async () => {
    const { id2 } = await seedInitialOffers()
    expect(await getIdsAndTotal({ limit: 1, offset: 1, type: 'sell' })).toEqual(
      [2, [id2]]
    )
    expect(await getIdsAndTotal({ limit: 1, offset: 2, type: 'sell' })).toEqual(
      [2, []]
    )
    expect(
      await getIdsAndTotal({
        limit: 10,
        offset: 0,
        type: 'buy',
        assetId: AssetId('ETH-9'),
      })
    ).toEqual([0, []])
  })

  describe(
    ForcedTradeOfferRepository.prototype.countActiveByPositionId.name,
    () => {
      it('counts active offers by position id', async () => {
        const positionId = fakeBigInt()
        const offer1 = fakeInitialOffer({ positionIdA: positionId })
        const offer2 = fakeInitialOffer()
        const accepted = fakeAccepted({ positionIdB: positionId })
        await repository.add(offer1)
        await repository.add(offer2)
        await repository.update({ ...offer2, accepted })

        expect(await repository.countActiveByPositionId(positionId)).toEqual(2)

        await repository.update({ ...offer1, cancelledAt: fakeTimestamp() })

        expect(await repository.countActiveByPositionId(positionId)).toEqual(1)
      })
    }
  )

  describe(ForcedTradeOfferRepository.prototype.getByPositionId.name, () => {
    it('returns active offers by position id A', async () => {
      const offer = fakeInitialOffer()
      await repository.add(offer)

      expect(await repository.getByPositionId(offer.positionIdA)).toEqual([
        offer,
      ])
    })
  })

  describe(ForcedTradeOfferRepository.prototype.getInitial.name, () => {
    it('deletes all records', async () => {
      await repository.add(fakeInitialOffer())
      await repository.add(fakeOffer())

      await repository.deleteAll()

      const actual = await repository.getInitial({ limit: 10, offset: 0 })
      expect(actual).toEqual([])
    })
  })

  describe(ForcedTradeOfferRepository.prototype.getInitialAssetIds.name, () => {
    it('returns the ids', async () => {
      await repository.add(
        fakeInitialOffer({
          syntheticAssetId: AssetId('ETH-9'),
        })
      )

      const ids = await repository.getInitialAssetIds()
      expect(ids).toEqual([AssetId('ETH-9')])
    })
  })

  describe(ForcedTradeOfferRepository.prototype.getPaginated.name, () => {
    it('respects the limit parameter', async () => {
      const ids = []
      for (let i = 0; i < 10; i++) {
        ids.push(
          await repository.add({
            ...fakeOffer(),
            createdAt: Timestamp(123000 - i),
          })
        )
      }
      const records = await repository.getPaginated({
        limit: 5,
        offset: 0,
      })

      expect(records.map((x) => x.id)).toEqual(ids.slice(0, 5))
    })

    it('respects the offset parameter', async () => {
      const ids = []
      for (let i = 0; i < 10; i++) {
        ids.push(
          await repository.add({
            ...fakeOffer(),
            createdAt: Timestamp(123000 - i),
          })
        )
      }
      const records = await repository.getPaginated({
        limit: 5,
        offset: 2,
      })
      expect(records.map((x) => x.id)).toEqual(ids.slice(2, 5 + 2))
    })
  })

  describe(
    ForcedTradeOfferRepository.prototype.getAvailablePaginated.name,
    () => {
      it('returns only offers that are available (not accepted or cancelled)', async () => {
        const ids = []
        //Add 5 offers that has not been accepted and cancelled
        for (let i = 0; i < 5; i++) {
          ids.push(
            await repository.add({
              ...fakeOffer({ accepted: undefined }),
              createdAt: Timestamp(123000 - i),
            })
          )
        }
        //Add 5 offers that has been accepted
        for (let i = 0; i < 5; i++) {
          ids.push(
            await repository.add({
              ...fakeOffer(),
              createdAt: Timestamp(123000 - i),
            })
          )
        }

        //Add 5 offers that has been cancelled
        for (let i = 0; i < 5; i++) {
          ids.push(
            await repository.add({
              ...fakeOffer({ accepted: undefined, cancelledAt: Timestamp(1) }),
              createdAt: Timestamp(123000 - i),
            })
          )
        }

        const records = await repository.getAvailablePaginated({
          limit: 15,
          offset: 0,
        })
        expect(records.length).toEqual(5)
        expect(records.map((x) => x.id)).toEqual(ids.slice(0, 5))
      })

      it('respects the limit parameter', async () => {
        const ids = []
        for (let i = 0; i < 10; i++) {
          ids.push(
            await repository.add({
              ...fakeOffer({ accepted: undefined }),
              createdAt: Timestamp(123000 - i),
            })
          )
        }
        const records = await repository.getAvailablePaginated({
          limit: 5,
          offset: 0,
        })

        expect(records.map((x) => x.id)).toEqual(ids.slice(0, 5))
      })

      it('respects the offset parameter', async () => {
        const ids = []
        for (let i = 0; i < 10; i++) {
          ids.push(
            await repository.add({
              ...fakeOffer({ accepted: undefined }),
              createdAt: Timestamp(123000 - i),
            })
          )
        }
        const records = await repository.getAvailablePaginated({
          limit: 5,
          offset: 2,
        })
        expect(records.map((x) => x.id)).toEqual(ids.slice(2, 5 + 2))
      })
    }
  )

  describe(ForcedTradeOfferRepository.prototype.countAll.name, () => {
    it('returns the number of records', async () => {
      expect(await repository.countAll()).toEqual(0)

      const expectedCount = 3
      for (let i = 0; i < expectedCount; i++) {
        await repository.add(fakeOffer())
      }

      expect(await repository.countAll()).toEqual(expectedCount)
    })
  })

  describe(ForcedTradeOfferRepository.prototype.countAvailable.name, () => {
    it('returns the number of available records', async () => {
      expect(await repository.countAvailable()).toEqual(0)

      await repository.add(fakeOffer({ accepted: undefined }))
      await repository.add(fakeOffer({ accepted: undefined }))
      await repository.add(
        fakeOffer({
          accepted: fakeAccepted(),
        })
      )
      await repository.add(fakeOffer({ cancelledAt: Timestamp(123) }))

      expect(await repository.countAvailable()).toEqual(2)
    })
  })

  describe(
    ForcedTradeOfferRepository.prototype.countByMakerOrTakerStarkKey.name,
    () => {
      it('returns the number of records', async () => {
        const starkKey = StarkKey.fake()
        expect(await repository.countByMakerOrTakerStarkKey(starkKey)).toEqual(
          0
        )

        await repository.add(
          fakeOffer({
            starkKeyA: starkKey,
          })
        )
        await repository.add(
          fakeOffer({
            accepted: {
              ...fakeAccepted({ starkKeyB: starkKey }),
            },
          })
        )
        await repository.add(fakeOffer())

        expect(await repository.countByMakerOrTakerStarkKey(starkKey)).toEqual(
          2
        )
      })
    }
  )

  describe(
    ForcedTradeOfferRepository.prototype.getByMakerOrTakerStarkKey.name,
    () => {
      it('returns the offers in which the user is involved', async () => {
        const starkKey = StarkKey.fake()
        const makerOffer = fakeOffer({
          starkKeyA: starkKey,
        })
        const takerOffer = fakeOffer({
          accepted: {
            ...fakeAccepted({ starkKeyB: starkKey }),
          },
        })
        const notInvolvedOffer = fakeOffer()

        await repository.add(makerOffer)
        await repository.add(takerOffer)
        await repository.add(notInvolvedOffer)

        expect(
          await repository.getByMakerOrTakerStarkKey(starkKey)
        ).toEqualUnsorted([makerOffer, takerOffer])
      })
    }
  )
})

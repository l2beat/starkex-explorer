import { AssetId, Hash256, StarkKey, Timestamp } from '@explorer/types'
import { fakeHexString } from '@explorer/types/src/fake'
import { expect } from 'earljs'

import {
  Accepted,
  ForcedTradeOfferRecord,
  ForcedTradeOfferRepository,
} from '../../../src/peripherals/database/ForcedTradeOfferRepository'
import { Logger } from '../../../src/tools/Logger'
import { fakeBigInt, fakeBoolean, fakeInt, fakeTimestamp } from '../../fakes'
import { setupDatabaseTestSuite } from './setup'

function fakeAccepted(accepted?: Partial<Accepted>): Accepted {
  return {
    at: fakeTimestamp(),
    nonce: fakeBigInt(),
    positionIdB: fakeBigInt(),
    premiumCost: fakeBoolean(),
    signature: fakeHexString(32),
    starkKeyB: StarkKey.fake(),
    submissionExpirationTime: fakeBigInt(),
    transactionHash: undefined,
    ...accepted,
  }
}

function fakeOffer(
  offer?: Partial<ForcedTradeOfferRecord>
): ForcedTradeOfferRecord {
  return {
    id: fakeInt(),
    createdAt: fakeTimestamp(),
    starkKeyA: StarkKey.fake(),
    positionIdA: fakeBigInt(),
    syntheticAssetId: AssetId('ETH-9'),
    amountCollateral: fakeBigInt(),
    amountSynthetic: fakeBigInt(),
    aIsBuyingSynthetic: true,
    accepted: fakeAccepted(offer?.accepted),
    ...offer,
  }
}

function fakeInitialOffer(
  offer?: Partial<Omit<ForcedTradeOfferRecord, 'accepted'>>
) {
  return fakeOffer({ ...offer, accepted: undefined })
}

describe(ForcedTradeOfferRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new ForcedTradeOfferRepository(knex, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds initial offer', async () => {
    const offer = fakeInitialOffer({ id: undefined })
    const id = await repository.add(offer)
    const actual = await repository.findById(id)
    expect(actual).toEqual({ ...offer, id })
  })

  it('saves accepted offer', async () => {
    const initial = fakeInitialOffer({ id: undefined })
    const id = await repository.add(initial)
    const accepted = {
      ...initial,
      id,
      accepted: fakeAccepted(),
    }
    const updated = await repository.save(accepted)
    expect(updated).toEqual(true)

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
    const updated = await repository.save(submitted)
    expect(updated).toEqual(true)

    const actual = await repository.findById(id)

    expect(actual).toEqual(submitted)
  })

  it('get all initial records', async () => {
    const initial = fakeInitialOffer()
    const id = await repository.add(initial)

    const actual = await repository.getInitial()
    expect(actual).toEqual([{ ...initial, id }])
  })

  it('deletes all records', async () => {
    await repository.add(fakeInitialOffer())
    await repository.add(fakeOffer())

    await repository.deleteAll()

    const actual = await repository.getLatestInitial({ limit: 10, offset: 0 })
    expect(actual).toEqual([])
  })

  it('returns latest initial offers', async () => {
    const initial1 = fakeInitialOffer({ createdAt: Timestamp(1) })
    const initial2 = fakeInitialOffer({ createdAt: Timestamp(2) })
    const initial3 = fakeInitialOffer({ createdAt: Timestamp(3) })
    const accepted1 = fakeOffer({ createdAt: Timestamp(1) })

    const id1 = await repository.add(initial1)
    const id2 = await repository.add(initial2)
    await repository.add(initial3)
    await repository.add(accepted1)

    const latest = await repository.getLatestInitial({ limit: 10, offset: 1 })

    expect(latest.map((o) => o.id)).toEqual([id2, id1])
  })
})

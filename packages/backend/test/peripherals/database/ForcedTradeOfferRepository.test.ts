import { AssetId, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import {
  ForcedTradeAcceptedOfferRecord,
  ForcedTradeOfferRepository,
} from '../../../src/peripherals/database/ForcedTradeOfferRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

const initialOffer1 = {
  createdAt: Timestamp(Date.now()),
  submittedAt: undefined,
  starkKeyA: StarkKey.fake(),
  positionIdA: 1n,
  syntheticAssetId: AssetId('ETH-18'),
  amountCollateral: 20n,
  amountSynthetic: 1000n,
  aIsBuyingSynthetic: true,
}

const initialOffer2 = {
  createdAt: Timestamp(Date.now()),
  submittedAt: undefined,
  starkKeyA: StarkKey.fake('1'),
  positionIdA: 2n,
  syntheticAssetId: AssetId('LINK-18'),
  amountCollateral: 50n,
  amountSynthetic: 600n,
  aIsBuyingSynthetic: false,
}

const initialOffer3 = {
  createdAt: Timestamp(Date.now()),
  submittedAt: undefined,
  starkKeyA: StarkKey.fake(),
  positionIdA: 3n,
  syntheticAssetId: AssetId('DAI-18'),
  amountCollateral: 500n,
  amountSynthetic: 500n,
  aIsBuyingSynthetic: true,
}

const acceptedOffer1: ForcedTradeAcceptedOfferRecord = {
  acceptedAt: Timestamp(Date.now()),
  starkKeyB: StarkKey.fake('4'),
  positionIdB: 4n,
  submissionExpirationTime: Math.floor(Date.now() / (3600 * 1000)) + 7 * 24,
  nonce: 1n,
  premiumCost: false,
  signature: '0x',
}

const acceptedOffer2: ForcedTradeAcceptedOfferRecord = {
  acceptedAt: Timestamp(Date.now()),
  starkKeyB: StarkKey.fake('5'),
  positionIdB: 5n,
  submissionExpirationTime: Math.floor(Date.now() / (3600 * 1000)) + 7 * 24,
  nonce: 1n,
  premiumCost: false,
  signature: '0x',
}

describe(ForcedTradeOfferRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new ForcedTradeOfferRepository(knex, Logger.SILENT)

  afterEach(() => repository.deleteAll())

  it('adds single initial offer and queries it', async () => {
    const id = await repository.addInitialOffer(initialOffer1)

    const actual = await repository.getAllInitialOffers()

    expect(actual).toEqual([{ id, ...initialOffer1 }])
  })

  it('queries all initial offers', async () => {
    const id1 = await repository.addInitialOffer(initialOffer1)
    const id2 = await repository.addInitialOffer(initialOffer2)

    const actual = await repository.getAllInitialOffers()

    expect(actual).toEqual([
      { id: id1, ...initialOffer1 },
      { id: id2, ...initialOffer2 },
    ])
  })

  it('queries all acccept offers', async () => {
    const id1 = await repository.addInitialOffer(initialOffer1)
    const id2 = await repository.addInitialOffer(initialOffer2)

    await repository.addAcceptedOffer({
      initialOfferId: id1,
      acceptedOffer: acceptedOffer1,
    })
    await repository.addAcceptedOffer({
      initialOfferId: id2,
      acceptedOffer: acceptedOffer2,
    })

    const actual = await repository.getAllAcceptedOffers()

    expect(actual).toEqual([acceptedOffer1, acceptedOffer2])
  })

  it('queries initial offer by id', async () => {
    await repository.addInitialOffer(initialOffer2)
    const id = await repository.addInitialOffer(initialOffer1)
    await repository.addInitialOffer(initialOffer3)

    const actual = await repository.findInitialOfferById(id)

    expect(actual).toEqual({ id, ...initialOffer1 })
  })

  it('queries initial offers by stark key', async () => {
    await repository.addInitialOffer(initialOffer1)
    const id = await repository.addInitialOffer(initialOffer2)
    await repository.addInitialOffer(initialOffer3)

    const actual = await repository.getInitialOffersByStarkKey(
      initialOffer2.starkKeyA
    )
    expect(actual).toEqual([{ id, ...initialOffer2 }])
  })

  it('queries accept offers by stark key', async () => {
    const id1 = await repository.addInitialOffer(initialOffer1)
    const id2 = await repository.addInitialOffer(initialOffer2)
    await repository.addInitialOffer(initialOffer3)

    await repository.addAcceptedOffer({
      initialOfferId: id1,
      acceptedOffer: acceptedOffer1,
    })
    await repository.addAcceptedOffer({
      initialOfferId: id2,
      acceptedOffer: acceptedOffer2,
    })

    const actual = await repository.getAcceptedOffersByStarkKey(
      acceptedOffer2.starkKeyB
    )
    expect(actual).toEqual([{ id: id2, ...initialOffer2, ...acceptedOffer2 }])
  })

  describe('accept offer', async () => {
    it('adds single accept offer', async () => {
      const id = await repository.addInitialOffer(initialOffer1)
      await repository.addAcceptedOffer({
        initialOfferId: id,
        acceptedOffer: acceptedOffer1,
      })

      const actual = await repository.findAcceptedOfferById(id)

      expect(actual).toEqual(acceptedOffer1)
    })

    it('queries offer with accept offer', async () => {
      const id = await repository.addInitialOffer(initialOffer1)
      await repository.addAcceptedOffer({
        initialOfferId: id,
        acceptedOffer: acceptedOffer1,
      })
      const actual = await repository.findOfferById(id)

      expect(actual).toEqual({ id, ...initialOffer1, ...acceptedOffer1 })
    })
  })

  it('deletes all records', async () => {
    await repository.addInitialOffer(initialOffer1)
    await repository.addInitialOffer(initialOffer2)

    await repository.deleteAll()

    const actual = await repository.getAllInitialOffers()
    expect(actual).toEqual([])

    const actualAccepted = await repository.getAllAcceptedOffers()
    expect(actualAccepted).toEqual([])
  })
})

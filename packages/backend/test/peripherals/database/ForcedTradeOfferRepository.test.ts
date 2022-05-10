import { AssetId, StarkKey, Timestamp } from '@explorer/types'
import { expect } from 'earljs'

import {
  ForcedTradeAcceptRecord,
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
  starkKeyA: StarkKey.fake(),
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

const acceptOffer1: ForcedTradeAcceptRecord = {
  acceptedAt: Timestamp(Date.now()),
  starkKeyB: StarkKey.fake(),
  positionIdB: 4n,
  submissionExpirationTime: Timestamp(Date.now() + 7 * 24 * 60 * 60 * 1000),
  nonce: 1n,
  premiumCost: false,
  signature: '0x',
}

const acceptOffer2: ForcedTradeAcceptRecord = {
  acceptedAt: Timestamp(Date.now()),
  starkKeyB: StarkKey.fake(),
  positionIdB: 5n,
  submissionExpirationTime: Timestamp(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

    await repository.addAcceptOffer(id1, acceptOffer1)
    await repository.addAcceptOffer(id2, acceptOffer2)

    const actual = await repository.getAllAcceptOffers()

    expect(actual).toEqual([acceptOffer1, acceptOffer2])
  })

  it('queries initial offer by id', async () => {
    await repository.addInitialOffer(initialOffer2)
    const id = await repository.addInitialOffer(initialOffer1)
    await repository.addInitialOffer(initialOffer3)

    const actual = await repository.getInitialOfferById(id)

    expect(actual).toEqual({ id, ...initialOffer1 })
  })

  describe('accept offer', async () => {
    it('adds single accept offer', async () => {
      const id = await repository.addInitialOffer(initialOffer1)
      await repository.addAcceptOffer(id, acceptOffer1)

      const actual = await repository.getAcceptOfferById(id)

      expect(actual).toEqual(acceptOffer1)
    })

    it('queries offer with accept offer', async () => {
      const id = await repository.addInitialOffer(initialOffer1)
      await repository.addAcceptOffer(id, acceptOffer1)

      const actual = await repository.getOfferById(id)

      expect(actual).toEqual({ id, ...initialOffer1, ...acceptOffer1 })
    })
  })

  it('deletes all records', async () => {
    await repository.addInitialOffer(initialOffer1)
    await repository.addInitialOffer(initialOffer2)

    await repository.deleteAll()

    const actual = await repository.getAllInitialOffers()
    expect(actual).toEqual([])

    const actualAccepted = await repository.getAllAcceptOffers()
    expect(actualAccepted).toEqual([])
  })
})

import { AssetId } from '@explorer/encoding'
import { expect } from 'earljs'

import {
  PositionUpdateRecord,
  PositionUpdateRepository,
} from '../../../src/peripherals/database/PositionUpdateRepository'
import { StateUpdateRepository } from '../../../src/peripherals/database/StateUpdateRepository'
import { Logger } from '../../../src/tools/Logger'
import { setupDatabaseTestSuite } from './setup'

describe(PositionUpdateRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const stateUpdateRepository = new StateUpdateRepository(knex, Logger.SILENT)
  const repository = new PositionUpdateRepository(knex, Logger.SILENT)

  const stateUpdateId = 1000
  beforeEach(() =>
    stateUpdateRepository.add([
      {
        id: stateUpdateId,
        factHash: '',
        rootHash: '',
        dataTimestamp: Math.floor(Date.now() / 1000),
        factTimestamp: Math.floor(Date.now() / 1000),
      },
    ])
  )
  afterEach(async () => {
    await repository.deleteAll()
    await stateUpdateRepository.delete(stateUpdateId)
  })

  it('adds single record and queries it', async () => {
    const record: PositionUpdateRecord = {
      stateUpdateId,
      positionId: 1n,
      publicKey:
        '0x006b56aeb3ee3df0002dfa4e2c65e335fbacf0f7a8f399a9beffe7b04534f7cd',
      collateralBalance: 1n,
      fundingTimestamp: 1n,
      balances: [],
    }
    await repository.addOrUpdate([record])

    const actual = await repository.getAll()

    expect(actual).toEqual([record])
  })

  it('adds 0 records', async () => {
    await repository.addOrUpdate([])
    expect(await repository.getAll()).toEqual([])
  })

  it('adds multiple records and queries them', async () => {
    const records: PositionUpdateRecord[] = [
      {
        stateUpdateId,
        positionId: BigInt(0),
        publicKey:
          '0x006b56aeb3ee3df0002dfa4e2c65e335fbacf0f7a8f399a9beffe7b04534f7cd',
        collateralBalance: BigInt(29234661877),
        fundingTimestamp: BigInt(1621958400),
        balances: [],
      },
      {
        stateUpdateId,
        positionId: BigInt(1),
        publicKey:
          '0x027cda895fbaa174bf10c8e0f57561fa9aa6a93cfec32b87f1bdfe55a161e358',
        collateralBalance: BigInt(408907817269),
        fundingTimestamp: BigInt(1621947600),
        balances: [],
      },
      {
        stateUpdateId,
        positionId: BigInt(2),
        publicKey:
          '0x015e8410e93e5c90b1bf7a393874f68f4cc7f477c5d742daac5c5a112e672d61',
        collateralBalance: BigInt(12280156418787),
        fundingTimestamp: BigInt(1621958400),
        balances: [
          {
            assetId: AssetId('1INCH-7'),
            balance: 63030000000n,
          },
          {
            assetId: AssetId('AAVE-8'),
            balance: -34197000000n,
          },
          {
            assetId: AssetId('AVAX-7'),
            balance: 0n,
          },
        ],
      },
    ]

    await repository.addOrUpdate(records)
    const actual = await repository.getAll()
    expect(actual).toBeAnArrayWith(...records)
  })

  it('deletes all records', async () => {
    await repository.addOrUpdate([
      {
        stateUpdateId,
        positionId: BigInt(3),
        publicKey:
          '0x027cda895fbaa174bf10c8e0f57561fa9aa6a93cfec32b87f1bdfe55a161e358',
        collateralBalance: BigInt(408907817269),
        fundingTimestamp: BigInt(1621947600),
        balances: [],
      },
      {
        stateUpdateId,
        positionId: BigInt(4),
        publicKey:
          '0x027cda895fbaa174bf10c8e0f57561fa9aa6a93cfec32b87f1bdfe55a161e358',
        collateralBalance: BigInt(408907817269),
        fundingTimestamp: BigInt(1621947600),
        balances: [],
      },
    ])
    await repository.deleteAll()
    const actual = await repository.getAll()
    expect(actual).toEqual([])
  })
})

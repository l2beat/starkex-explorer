import { expect } from 'earljs'

import { TransactionStatusRepository } from '../../../src/peripherals/database/TransactionStatusRepository'
import { Logger } from '../../../src/tools/Logger'
import { fakeSentTransaction, fakeTimestamp } from '../../fakes'
import { setupDatabaseTestSuite } from './setup'

describe(TransactionStatusRepository.name, () => {
  const { knex } = setupDatabaseTestSuite()
  const repository = new TransactionStatusRepository(knex, Logger.SILENT)

  beforeEach(() => repository.deleteAll())

  it('adds transaction', async () => {
    const tx = fakeSentTransaction()
    await repository.add(tx)
  })

  it('returns transactions waiting to be mined', async () => {
    const sent = fakeSentTransaction()
    const mined = {
      ...fakeSentTransaction(),
      mined: {
        at: fakeTimestamp(),
        blockNumber: 1,
      },
    }
    const reverted = {
      ...fakeSentTransaction(),
      revertedAt: fakeTimestamp(),
    }
    const forgotten = {
      ...fakeSentTransaction(),
      forgottenAt: fakeTimestamp(),
    }
    await repository.add(sent)
    await repository.add(mined)
    await repository.add(reverted)
    await repository.add(forgotten)

    const waiting = await repository.getWaitingToBeMined()
    expect(waiting).toEqual([sent])
  })

  it('updates transaction waiting to be mined', async () => {
    const sent = fakeSentTransaction()
    await repository.add(sent)
    const minedAt = fakeTimestamp()
    const blockNumber = 1

    const updated = await repository.updateWaitingToBeMined({
      ...sent,
      mined: {
        at: minedAt,
        blockNumber,
      },
    })

    expect(updated).toEqual(true)
    const waiting = await repository.getWaitingToBeMined()
    expect(waiting).toEqual([])
  })
})

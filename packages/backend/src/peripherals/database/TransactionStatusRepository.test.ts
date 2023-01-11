import { expect } from 'earljs'

import { setupDatabaseTestSuite } from '../../test/database'
import { fakeSentTransaction, fakeTimestamp } from '../../test/fakes'
import { Logger } from '../../tools/Logger'
import { TransactionStatusRepository } from './TransactionStatusRepository'

describe(TransactionStatusRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new TransactionStatusRepository(database, Logger.SILENT)

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

    const updated = await repository.updateIfWaitingToBeMined({
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

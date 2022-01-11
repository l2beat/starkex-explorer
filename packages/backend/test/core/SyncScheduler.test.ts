import { SyncScheduler } from '../../src/core/SyncScheduler'

describe(SyncScheduler.name, () => {
  it('respects earliestBlock', () => {})
  it('syncs in batches', () => {
    // calls dataSyncService.sync({ from: 10, to: 20 })
    // calls dataSyncService.sync({ from: 21, to: 30 })
  })
  it('handles incoming new blocks')
  it('reruns failing syncs')
})

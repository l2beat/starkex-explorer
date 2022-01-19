import { MemoryHashEventCollector } from '../../src/core/MemoryHashEventCollector'
import { FactToPageRepository } from '../../src/peripherals/database/FactToPageRepository'
import type { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { mock } from '../mock'

describe(MemoryHashEventCollector.name, () => {
  it('fetches memory hash events and saves them to repository', () => {
    const ethereumClient = mock<EthereumClient>({})
    const factToPageRepository = mock<FactToPageRepository>({
      add: async () => {},
    })

    const collector = new MemoryHashEventCollector(
      ethereumClient,
      factToPageRepository
    )

    collector.collect({ from: 10, to: 25 }, [])

    // @todo similar to verifier collector tests
  })
})

function testData() {
  return {
    // @todo real logs
    logs: [],
  }
}

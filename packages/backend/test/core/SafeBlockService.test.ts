import FakeTimers from '@sinonjs/fake-timers'
import { expect } from 'chai'

import { SafeBlock, SafeBlockService } from '../../src/core/SafeBlockService'
import { EthereumClient } from '../../src/peripherals/ethereum/EthereumClient'
import { Block } from '../../src/peripherals/ethereum/types'
import { Logger } from '../../src/tools/Logger'
import { mock } from '../mock'

describe('SafeBlockService', () => {
  it('can obtain the safe block', async () => {
    const ethereumClient = mock<EthereumClient>({
      async getBlockNumber() {
        return 556
      },
      async getBlock(blockNumber) {
        expect(blockNumber).to.eq(456)
        return {
          timestamp: 1234,
        } as Block
      },
    })
    const service = new SafeBlockService(
      100000,
      100,
      ethereumClient,
      Logger.SILENT
    )
    const stop = await service.start()
    stop()
    const block = service.getSafeBlock()
    expect(block).to.deep.eq({
      timestamp: 1234,
      blockNumber: 456,
    })
  })

  it('throws when not started', () => {
    const service = new SafeBlockService(
      100000,
      100,
      mock<EthereumClient>(),
      Logger.SILENT
    )
    expect(() => service.getSafeBlock()).to.throw(Error, 'Not started')
  })

  it('refreshes the block and emits events', async () => {
    let lastBlock = 556
    const ethereumClient = mock<EthereumClient>({
      async getBlockNumber() {
        return lastBlock++
      },
      async getBlock(blockNumber) {
        return {
          timestamp: Number((blockNumber as number) * 2),
        } as Block
      },
    })
    const service = new SafeBlockService(
      1000,
      100,
      ethereumClient,
      Logger.SILENT
    )

    const clock = FakeTimers.install()
    const blocks: SafeBlock[] = []

    service.onNewSafeBlock((e) => blocks.push(e))
    await service.start()

    await clock.tickAsync(3000)
    clock.uninstall()

    expect(blocks).to.deep.eq([
      {
        blockNumber: 456,
        timestamp: 912,
      },
      {
        blockNumber: 457,
        timestamp: 914,
      },
      {
        blockNumber: 458,
        timestamp: 916,
      },
      {
        blockNumber: 459,
        timestamp: 918,
      },
    ])
  })
})

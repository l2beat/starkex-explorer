import { utils } from 'ethers'

import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockRange } from '../peripherals/ethereum/types'

const REGISTRY_ABI = new utils.Interface([
  'event LogMemoryPageFactContinuous(bytes32 factHash, uint256 memoryHash, uint256 prod)',
])

const REGISTRY_ADDRESS = '0xEfbCcE4659db72eC6897F46783303708cf9ACef8'

const GPS_VERIFIER_ABI = new utils.Interface([
  'event LogMemoryPagesHashes(bytes32 factHash, bytes32[] pagesHashes)',
])

export class MemoryEventCollector {
  constructor(private readonly ethereumClient: EthereumClient) {}

  async collectMemoryHashEvents(blockRange: BlockRange, verifierAddress: string) {
    const hashEvents = await this.getMemoryHashEvents(blockRange, verifierAddress)
    // thsi.repo.saveMemoryHashEvents(hashEvents)
  }

  async getMemoryPageEvents(
    blockRange: BlockRange
  ): Promise<MemoryPageEvent[]> {
    const res: MemoryPageEvent[] = []

    const logs = await this.ethereumClient.getLogs({
      address: REGISTRY_ADDRESS,
      fromBlock: blockRange.from,
      toBlock: blockRange.to,
      topics: [REGISTRY_ABI.getEventTopic('LogMemoryPageFactContinuous')],
    })

    const events = logs
      .map((log) => ({ log, event: REGISTRY_ABI.parseLog(log) }))
      .map(
        ({ log, event }): MemoryPageEvent => ({
          memoryHash: event.args.memoryHash.toHexString(),
          transactionHash: log.transactionHash,
        })
      )

    res.push(...events)

    return res
  }

  private async getMemoryHashEvents(
    blockRange: BlockRange,
    verifierAddress: string
  ): Promise<MemoryHashEvent[]> {
    const res: MemoryHashEvent[] = []

    const logs = await this.ethereumClient.getLogs({
      address: verifierAddress,
      fromBlock: blockRange.from,
      toBlock: blockRange.to,
      topics: [GPS_VERIFIER_ABI.getEventTopic('LogMemoryPagesHashes')],
    })

    const events = logs.map((log): MemoryHashEvent => {
      const event = GPS_VERIFIER_ABI.parseLog(log)

      return {
        factHash: event.args.factHash,
        pagesHashes: event.args.pagesHashes,
      }
    })

    res.push(...events)

    return res
  }
}

interface MemoryPageEvent {
  memoryHash: string
  transactionHash: string
}

interface MemoryHashEvent {
  factHash: string
  pagesHashes: string[]
}

import { providers, utils } from 'ethers'

import { BlockRange } from '../../peripherals/ethereum/types'
import { Cache } from '../../peripherals/FileSystemCache'
import { GetLogs } from './types'

const REGISTRY_ABI = new utils.Interface([
  'event LogMemoryPageFactContinuous(bytes32 factHash, uint256 memoryHash, uint256 prod)',
])

const REGISTRY_ADDRESS = '0xEfbCcE4659db72eC6897F46783303708cf9ACef8'

interface MemoryPageEvent {
  memoryHash: string
  transactionHash: string
}

export async function getMemoryPageEvents(
  getLogs: GetLogs,
  blockRange: BlockRange,
  cache: Cache
) {
  const batches = getBatches(blockRange.from, blockRange.to, 10 ** 5)
  const events: MemoryPageEvent[] = []
  for (const range of batches) {
    events.push(...(await getEventBatch(getLogs, range, cache)))
  }
  return events
}

function getBatches(from: number, to: number, batchSize: number) {
  const batches: BlockRange[] = []
  for (let start = from; start <= to; start += batchSize) {
    batches.push({ from: start, to: Math.min(start + batchSize - 1, to) })
  }
  return batches
}

async function getEventBatch(
  getLogs: GetLogs,
  blockRange: BlockRange,
  cache: Cache
) {
  const cacheKey = `memory-page-${blockRange.from}-${blockRange.to}`
  const cached = (await cache.get(cacheKey)) as MemoryPageEvent[]
  if (cached) {
    return cached
  }

  const logs = await getLogs({
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

  cache.set(cacheKey, events)
  return events
}

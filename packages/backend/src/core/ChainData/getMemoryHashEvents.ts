import { providers, utils } from 'ethers'

import { BlockRange } from '../../peripherals/ethereum/types'
import { Cache } from '../../peripherals/FileSystemCache'
import { GetLogs } from './types'

const GPS_VERIFIER_ABI = new utils.Interface([
  'event LogMemoryPagesHashes(bytes32 factHash, bytes32[] pagesHashes)',
])

export interface MemoryHashEvent {
  factHash: string
  pagesHashes: string[]
}

export async function getMemoryHashEvents(
  getLogs: GetLogs,
  address: string,
  blockRange: BlockRange,
  cache: Cache
) {
  const batches = getBatches(blockRange.from, blockRange.to, 10 ** 5)
  const events: MemoryHashEvent[] = []
  for (const [from, to] of batches) {
    events.push(...(await getEventBatch(getLogs, address, from, to, cache)))
  }
  return events
}

function getBatches(from: number, to: number, batchSize: number) {
  const batches: [number, number][] = []
  for (let start = from; start <= to; start += batchSize) {
    batches.push([start, Math.min(start + batchSize - 1, to)])
  }
  return batches
}

async function getEventBatch(
  getLogs: GetLogs,
  address: string,
  fromBlock: number,
  toBlock: number,
  cache: Cache
) {
  const cacheKey = `memory-hash-${address}-${fromBlock}-${toBlock}`
  const cached = (await cache.get(cacheKey)) as MemoryHashEvent[]
  if (cached) {
    return cached
  }
  const logs = await getLogs({
    address,
    fromBlock,
    toBlock,
    topics: [GPS_VERIFIER_ABI.getEventTopic('LogMemoryPagesHashes')],
  })
  const events = logs
    .map((log) => ({ log, event: GPS_VERIFIER_ABI.parseLog(log) }))
    .map(
      ({ event }): MemoryHashEvent => ({
        factHash: event.args.factHash,
        pagesHashes: event.args.pagesHashes,
      })
    )
  await cache.set(cacheKey, events)
  return events
}

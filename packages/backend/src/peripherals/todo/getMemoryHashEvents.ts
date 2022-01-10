import { providers, utils } from 'ethers'

import { getCache, setCache } from './cache'

const GPS_VERIFIER_ABI = new utils.Interface([
  'event LogMemoryPagesHashes(bytes32 factHash, bytes32[] pagesHashes)',
])

export interface MemoryHashEvent {
  factHash: string
  pagesHashes: string[]
}

export async function getMemoryHashEvents(
  provider: providers.Provider,
  address: string,
  fromBlock: number,
  toBlock: number
) {
  const batches = getBatches(fromBlock, toBlock, 10 ** 5)
  const events: MemoryHashEvent[] = []
  for (const [from, to] of batches) {
    events.push(...(await getEventBatch(provider, address, from, to)))
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
  provider: providers.Provider,
  address: string,
  fromBlock: number,
  toBlock: number
) {
  const cacheKey = `memory-hash-${address}-${fromBlock}-${toBlock}`
  const cached = getCache<MemoryHashEvent[]>(cacheKey)
  if (cached) {
    return cached
  }
  const logs = await provider.getLogs({
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
  setCache(cacheKey, events)
  return events
}

import { providers, utils } from 'ethers'

import { getCache, setCache } from './cache'

const REGISTRY_ABI = new utils.Interface([
  'event LogMemoryPageFactContinuous(bytes32 factHash, uint256 memoryHash, uint256 prod)',
])

const REGISTRY_ADDRESS = '0xEfbCcE4659db72eC6897F46783303708cf9ACef8'

interface MemoryPageEvent {
  memoryHash: string
  transactionHash: string
}

export async function getMemoryPageEvents(
  provider: providers.Provider,
  fromBlock: number,
  toBlock: number
) {
  const batches = getBatches(fromBlock, toBlock, 10 ** 5)
  const events: MemoryPageEvent[] = []
  for (const [from, to] of batches) {
    events.push(...(await getEventBatch(provider, from, to)))
    console.log(to)
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
  fromBlock: number,
  toBlock: number
) {
  const cacheKey = `memory-page-${fromBlock}-${toBlock}`
  const cached = getCache<MemoryPageEvent[]>(cacheKey)
  if (cached) {
    return cached
  }
  const logs = await provider.getLogs({
    address: REGISTRY_ADDRESS,
    fromBlock,
    toBlock,
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
  setCache(cacheKey, events)
  return events
}

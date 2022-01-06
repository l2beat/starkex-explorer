import { BigNumber, providers, utils } from 'ethers'

import { getFacts } from './getFacts'
import { getGpsVerifiers } from './getGpsVerifiers'
import { getMemoryHashEvents, MemoryHashEvent } from './getMemoryHashEvents'
import { getMemoryPageEvents } from './getMemoryPageEvents'

export const PERPETUAL_ADDRESS = '0xD54f502e184B6B739d7D27a6410a67dc462D69c8'

export const PERPETUAL_ABI = new utils.Interface([
  'event LogStateTransitionFact(bytes32 stateTransitionFact)',
])

export const PAGE_ABI = new utils.Interface([
  'function registerContinuousMemoryPage(uint256 startAddr, uint256[] values, uint256 z, uint256 alpha, uint256 prime)',
])

export async function getOnChainData(blockHash: string) {
  const provider = new providers.AlchemyProvider()
  const facts = await getFacts(provider, blockHash)
  const verifiers = await getGpsVerifiers(provider)
  const mpEvents = await getMemoryPageEvents(provider, 11813207, 13777355)
  const memoryHashEvents: MemoryHashEvent[] = []
  for (const verifier of verifiers) {
    memoryHashEvents.push(
      ...(await getMemoryHashEvents(provider, verifier, 11813207, 13777355))
    )
  }
  const mpMap = new Map(mpEvents.map((x) => [x.memoryHash, x.transactionHash]))
  const transactionHashes = facts
    .flatMap(
      (fact) =>
        memoryHashEvents.find((x) => x.factHash === fact)?.pagesHashes ?? []
    )
    .map((x) => mpMap.get(x))
  const pages: BigNumber[][] = []
  for (const hash of transactionHashes) {
    if (!hash) {
      continue
    }
    const tx = await provider.getTransaction(hash)
    const decoded = PAGE_ABI.decodeFunctionData(
      'registerContinuousMemoryPage',
      tx.data
    )
    pages.push(decoded[1])
  }
  const result = pages.map((page) =>
    page.map((x) => x.toHexString().substring(2).padStart(64, '0'))
  )
  return result
}

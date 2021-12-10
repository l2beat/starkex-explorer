import { providers, utils } from 'ethers'

import { getGpsVerifiers } from './getGpsVerifiers'
import { getMemoryPageEvents } from './getMemoryPageEvents'

const PERPETUAL_ADDRESS = '0xD54f502e184B6B739d7D27a6410a67dc462D69c8'

const PERPETUAL_ABI = new utils.Interface([
  'event LogStateTransitionFact(bytes32 stateTransitionFact)',
])

export async function getStateTransitionFacts(blockHash: string) {
  const provider = new providers.AlchemyProvider()
  const logs = await provider.getLogs({
    address: PERPETUAL_ADDRESS,
    blockHash,
    topics: [PERPETUAL_ABI.getEventTopic('LogStateTransitionFact')],
  })
  const events = logs.map((log) => PERPETUAL_ABI.parseLog(log))
  const facts = events.map((event) => event.args.stateTransitionFact)
  const verifiers = await getGpsVerifiers(provider)
  const latest = (await provider.getBlockNumber()) - 100
  const mpEvents = await getMemoryPageEvents(provider, 11813207, 13777355)
  console.log(mpEvents)
}

const GPS_VERIFIER_ABI = new utils.Interface([
  'event LogMemoryPagesHashes(bytes32 factHash, bytes32[] pagesHashes)',
])

import { utils } from 'ethers'

import { GetLogs } from './types'

const PERPETUAL_ADDRESS = '0xD54f502e184B6B739d7D27a6410a67dc462D69c8'

const PERPETUAL_ABI = new utils.Interface([
  'event LogStateTransitionFact(bytes32 stateTransitionFact)',
])

export async function getFacts(getLogs: GetLogs, blockHash: string) {
  const logs = await getLogs({
    address: PERPETUAL_ADDRESS,
    blockHash,
    topics: [PERPETUAL_ABI.getEventTopic('LogStateTransitionFact')],
  })
  const events = logs.map((log) => PERPETUAL_ABI.parseLog(log))

  return events.map((event): string => event.args.stateTransitionFact)
}

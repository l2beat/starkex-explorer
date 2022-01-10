import { utils } from 'ethers'
import { AbiCoder } from 'ethers/lib/utils'

import type {
  BlockRange,
  Filter,
  FilterByBlockHash,
  Log,
} from '../../peripherals/ethereum/types'

const PROXY_ADDRESS = '0xC8c212f11f6ACca77A7afeB7282dEBa5530eb46C'

const PROXY_ABI = new utils.Interface([
  'event ImplementationAdded(address indexed implementation, bytes initializer, bool finalize)',
  'event Upgraded(address indexed implementation)',
])

type GetLogs = (filter: Filter | FilterByBlockHash) => Promise<Log[]>

export async function getGpsVerifiers(
  getLogs: GetLogs,
  blockRange: BlockRange
) {
  const [added, upgraded] = await Promise.all([
    getImplementationAddedEvents(getLogs, blockRange),
    getUpgradedEvents(getLogs, blockRange),
  ])

  // sort by block number descending
  added.sort((a, b) => b.blockNumber - a.blockNumber)

  return upgraded
    .map(
      // get closest preceding added event with the same implementation
      (u) => {
        const addedEvent = added.find(
          (a) =>
            a.implementation === u.implementation &&
            a.blockNumber <= u.blockNumber
        )

        return (
          addedEvent && {
            address: addedEvent.initializer,
            blockNumber: u.blockNumber,
          }
        )
      }
    )
    .filter((x): x is Exclude<typeof x, undefined> => x !== undefined)
}

function decodeAddress(data: string): string {
  return new AbiCoder().decode(['address'], data)[0]
}

interface ImplementationAddedEvent {
  implementation: string
  initializer: string
  blockNumber: number
}

export async function getImplementationAddedEvents(
  getLogs: GetLogs,
  blockRange: BlockRange
) {
  const logs = await getLogs({
    address: PROXY_ADDRESS,
    fromBlock: blockRange.from,
    toBlock: blockRange.to,
    topics: [PROXY_ABI.getEventTopic('ImplementationAdded')],
  })
  return logs
    .map((log) => ({ log, event: PROXY_ABI.parseLog(log) }))
    .map(
      ({ log, event }): ImplementationAddedEvent => ({
        implementation: event.args.implementation,
        initializer: event.args.initializer,
        blockNumber: log.blockNumber,
      })
    )
}

interface UpgradedEvent {
  implementation: string
  blockNumber: number
}

export async function getUpgradedEvents(
  getLogs: GetLogs,
  blockRange: BlockRange
) {
  const logs = await getLogs({
    address: PROXY_ADDRESS,
    fromBlock: blockRange.from,
    toBlock: blockRange.to,
    topics: [PROXY_ABI.getEventTopic('Upgraded')],
  })
  return logs
    .map((log) => ({ log, event: PROXY_ABI.parseLog(log) }))
    .map(
      ({ log, event }): UpgradedEvent => ({
        implementation: event.args.implementation,
        blockNumber: log.blockNumber,
      })
    )
}

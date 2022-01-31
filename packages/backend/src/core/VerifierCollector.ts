import { utils } from 'ethers'
import { AbiCoder } from 'ethers/lib/utils'
import { partition } from 'lodash'

import { EthereumAddress } from '../model'
import { BlockRange } from '../model/BlockRange'
import {
  ImplementationAddedEventRecord,
  UpgradedEventRecord,
  VerifierEventRecord,
  VerifierEventRepository,
} from '../peripherals/database/VerifierEventRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'

const PROXY_ADDRESS = '0xC8c212f11f6ACca77A7afeB7282dEBa5530eb46C'

const PROXY_ABI = new utils.Interface([
  'event ImplementationAdded(address indexed implementation, bytes initializer, bool finalize)',
  'event Upgraded(address indexed implementation)',
])

const Upgraded = PROXY_ABI.getEventTopic('Upgraded')
const ImplementationAdded = PROXY_ABI.getEventTopic('ImplementationAdded')

export class VerifierCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly verifierEventRepository: VerifierEventRepository
  ) {}

  /**
   * Saves new `Upgraded` and `ImplementationAdded` events to the database,
   * and returns verifier addresses derived from both the old and new events.
   */
  async collect(blockRange: BlockRange): Promise<EthereumAddress[]> {
    const oldEvents = this.verifierEventRepository.getAll()
    const newEvents = await this.getEvents(blockRange)
    const savingNewEventsToDb = this.verifierEventRepository.add(newEvents)

    const events = [...(await oldEvents), ...newEvents]
    const [upgraded, added] = partitionVerifierEvents(events)

    added.sort(byBlockNumberDescending)

    await savingNewEventsToDb

    return computeVerifiersFromEvents(added, upgraded)
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.verifierEventRepository.deleteAllAfter(lastToKeep)
  }

  private async getEvents(blockRange: BlockRange) {
    const logs = await this.ethereumClient.getLogs({
      address: PROXY_ADDRESS,
      fromBlock: blockRange.from,
      toBlock: blockRange.to,
      topics: [[ImplementationAdded, Upgraded]],
    })

    const events = logs
      .filter((log) => blockRange.has(log))
      .map((log): VerifierEventRecord => {
        const event = PROXY_ABI.parseLog(log)
        return {
          name: event.name as 'ImplementationAdded' | 'Upgraded',
          blockNumber: log.blockNumber,
          implementation: event.args.implementation,
          initializer: event.args.initializer,
        }
      })

    return events
  }
}

/**
 * ImplementationAdded and Upgraded events are the source of truth for verifiers
 * which addresses are found in the `upgradeEvent.initializer` field.
 */
function computeVerifiersFromEvents(
  added: ImplementationAddedEventRecord[],
  upgraded: UpgradedEventRecord[]
): EthereumAddress[] {
  return upgraded
    .map(
      // get closest preceding added event with the same implementation
      (u) =>
        added.find(
          (a) =>
            a.implementation === u.implementation &&
            a.blockNumber <= u.blockNumber
        )
    )
    .filter((x): x is ImplementationAddedEventRecord => x !== undefined)
    .map((x) => decodeAddress(x.initializer))
}

function decodeAddress(data: string): EthereumAddress {
  const decoded = new AbiCoder().decode(['address'], data)[0]
  return EthereumAddress(decoded)
}

function partitionVerifierEvents(events: VerifierEventRecord[]) {
  return partition(
    events,
    (e): e is UpgradedEventRecord => e.name === 'Upgraded'
  )
}

function byBlockNumberDescending(
  a: { blockNumber: number },
  b: { blockNumber: number }
) {
  return b.blockNumber - a.blockNumber
}

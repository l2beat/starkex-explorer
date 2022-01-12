import { utils } from 'ethers'
import { AbiCoder } from 'ethers/lib/utils'

import { EthereumAddress } from '../model'
import {
  ImplementationAddedEventRecord,
  UpgradedEventRecord,
  VerifierEventRecord,
  VerifierEventRepository,
} from '../peripherals/database/VerifierEventRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockRange } from '../peripherals/ethereum/types'
import { partition } from '../tools/partition'

const PROXY_ADDRESS = '0xC8c212f11f6ACca77A7afeB7282dEBa5530eb46C'

const PROXY_ABI = new utils.Interface([
  'event ImplementationAdded(address indexed implementation, bytes initializer, bool finalize)',
  'event Upgraded(address indexed implementation)',
])

const Upgraded = PROXY_ABI.getEventTopic('Upgraded')
const ImplementationAdded = PROXY_ABI.getEventTopic('ImplementationAdded')

export class VerifierCollector {
  constructor(
    private readonly ethereumClient: Pick<EthereumClient, 'getLogs'>,
    private readonly verifierEventRepository: VerifierEventRepository
  ) {}

  /**
   * Saves new `Upgraded` and `ImplementationAdded` events to the database,
   * and returns verifier addresses derived from both the old and new events.
   */
  async collect(blockRange: BlockRange): Promise<EthereumAddress[]> {
    const oldEvents = this.verifierEventRepository.getAll()
    const newEvents = this.getEvents(blockRange)
    const savingNewEventsToDb = newEvents.then((events) =>
      this.verifierEventRepository.addOrUpdate(events)
    )

    const [oldUpgraded, oldAdded] = partitionVerifierEvents(await oldEvents)
    const [newUpgraded, newAdded] = partitionVerifierEvents(await newEvents)

    oldAdded.sort(byBlockNumberDescending)
    newAdded.sort(byBlockNumberDescending)

    // verifiers we already knew about
    const oldVerifiers = computeVerifiersFromEvents(oldAdded, oldUpgraded)

    // verifiers upgraded in the block range
    const newVerifiers = computeVerifiersFromEvents(
      [...oldAdded, ...newAdded],
      newUpgraded
    )

    await savingNewEventsToDb

    return [...oldVerifiers, ...newVerifiers]
  }

  private async getEvents(blockRange: BlockRange) {
    const logs = await this.ethereumClient.getLogs({
      address: PROXY_ADDRESS,
      fromBlock: blockRange.from,
      toBlock: blockRange.to,
      topics: [[ImplementationAdded, Upgraded]],
    })

    const events = logs.map((log): VerifierEventRecord => {
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

import { EthereumAddress } from '@explorer/types'
import { AbiCoder } from 'ethers/lib/utils'
import { partition } from 'lodash'

import { BlockRange } from '../../model/BlockRange'
import {
  VerifierEventRecord,
  VerifierEventRepository,
} from '../../peripherals/database/VerifierEventRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../../peripherals/ethereum/types'
import { ImplementationAdded, Upgraded } from './events'

export class VerifierCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly verifierEventRepository: VerifierEventRepository,
    private readonly proxyAddress: EthereumAddress,
    private readonly hardcodedAddresses: EthereumAddress[]
  ) {}

  /**
   * Saves new `Upgraded` and `ImplementationAdded` events to the database,
   * and returns verifier addresses derived from both the old and new events.
   */
  async collect(blockRange: BlockRange): Promise<EthereumAddress[]> {
    const oldEvents = this.verifierEventRepository.getAll()
    const newEvents = await this.getEvents(blockRange)
    const savingNewEventsToDb = this.verifierEventRepository.addMany(newEvents)

    const events = [...(await oldEvents), ...newEvents]
    const [upgraded, added] = partition(events, (e) => e.name === 'Upgraded')

    added.sort(byBlockNumberDescending)

    await savingNewEventsToDb

    const computed = computeVerifiersFromEvents(added, upgraded)

    return computed
      .concat(this.hardcodedAddresses)
      .filter((x, i, a) => a.indexOf(x) === i)
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.verifierEventRepository.deleteAfter(lastToKeep)
  }

  private async getEvents(blockRange: BlockRange) {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.proxyAddress.toString(),
      topics: [[ImplementationAdded.topic, Upgraded.topic]],
    })
    return logs.map((log): Omit<VerifierEventRecord, 'id'> => {
      const event =
        ImplementationAdded.safeParseLog(log) ?? Upgraded.parseLog(log)
      return {
        name: event.name,
        blockNumber: log.blockNumber,
        implementation: event.args.implementation,
        initializer:
          event.name === 'ImplementationAdded'
            ? event.args.initializer
            : undefined,
      }
    })
  }
}

/**
 * ImplementationAdded and Upgraded events are the source of truth for verifiers
 * which addresses are found in the `upgradeEvent.initializer` field.
 */
function computeVerifiersFromEvents(
  added: Omit<VerifierEventRecord, 'id'>[],
  upgraded: Omit<VerifierEventRecord, 'id'>[]
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
    .flatMap((x) => (x?.initializer ? [decodeAddress(x.initializer)] : []))
}

function decodeAddress(data: string): EthereumAddress {
  const decoded = new AbiCoder().decode(['address'], data)[0] as string
  return EthereumAddress(decoded)
}

function byBlockNumberDescending(
  a: { blockNumber: number },
  b: { blockNumber: number }
) {
  return b.blockNumber - a.blockNumber
}

import { providers, utils } from 'ethers'
import { AbiCoder } from 'ethers/lib/utils'

const PROXY_ADDRESS = '0xC8c212f11f6ACca77A7afeB7282dEBa5530eb46C'

const PROXY_ABI = new utils.Interface([
  'event ImplementationAdded(address indexed implementation, bytes initializer, bool finalize)',
  'event Upgraded(address indexed implementation)',
])

export async function getGpsVerifiers(provider: providers.Provider) {
  const [added, upgraded] = await Promise.all([
    getImplementationAddedEvents(provider),
    getUpgradedEvents(provider),
  ])

  // sort by block number descending
  added.sort((a, b) => b.blockNumber - a.blockNumber)

  const addresses = upgraded
    .map(
      // get closest preceding added event with the same implementation
      (u) =>
        added.find(
          (a) =>
            a.implementation === u.implementation &&
            a.blockNumber <= u.blockNumber
        )
    )
    .filter((x): x is ImplementationAddedEvent => x !== undefined)
    .map((x) => decodeAddress(x.initializer))

  return addresses
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
  provider: providers.Provider
) {
  const logs = await provider.getLogs({
    address: PROXY_ADDRESS,
    fromBlock: 0,
    toBlock: 'latest',
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

export async function getUpgradedEvents(provider: providers.Provider) {
  const logs = await provider.getLogs({
    address: PROXY_ADDRESS,
    fromBlock: 0,
    toBlock: 'latest',
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

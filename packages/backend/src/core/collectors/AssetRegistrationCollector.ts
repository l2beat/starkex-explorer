import { AssetHash, EthereumAddress, Hash256 } from '@explorer/types'

import { BlockRange } from '../../model'
import { AssetDetails } from '@explorer/shared'
import {
  AssetRegistrationRecord,
  AssetRepository,
} from '../../peripherals/database/AssetRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { TokenInspector } from '../../peripherals/ethereum/TokenInspector'
import { LogTokenRegistered } from './events'

export interface TokenRegistration {
  name: string
  assetId: Hash256
}

const ETH_SELECTOR = '0x8322fff2'
const ERC20_SELECTOR = '0xf47261b0'
const ERC721_SELECTOR = '0x02571792'
const ERC1155_SELECTOR = `0x3348691d`
const MINTABLE_ERC721_SELECTOR = '0xb8b86672'
const MINTABLE_ERC20_SELECTOR = '0x68646e2d'

type RegistrationEvent = ReturnType<typeof LogTokenRegistered.parseLog>

export class AssetRegistrationCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly contractAddress: EthereumAddress,
    private readonly assetRepository: AssetRepository,
    private readonly tokenInspector: TokenInspector
  ) {}

  async collect(blockRange: BlockRange) {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.contractAddress.toString(),
      topics: [LogTokenRegistered.topic],
    })

    const results = await Promise.all(
      logs.map(async (log) => {
        const event = LogTokenRegistered.parseLog(log)
        return this.processEvent(event)
      })
    )

    const registrations: AssetRegistrationRecord[] = []
    const details: AssetDetails[] = []
    for (const [registration, detail] of results) {
      registrations.push(registration)
      if (detail) {
        details.push(detail)
      }
    }

    await this.assetRepository.addManyRegistrations(registrations)
    await this.assetRepository.addManyDetails(details)

    return registrations.length
  }

  private async processEvent(
    event: RegistrationEvent
  ): Promise<[AssetRegistrationRecord, AssetDetails | undefined]> {
    const assetSelector = event.args.assetInfo.substring(0, 10)
    const quantum = event.args.quantum.toBigInt()
    const assetTypeHash = Hash256.from(event.args.assetType)

    switch (assetSelector) {
      case ETH_SELECTOR: {
        return [
          { assetTypeHash, type: 'ETH', quantum, contractError: [] },
          {
            assetHash: AssetHash(assetTypeHash.toString()),
            assetTypeHash,
            type: 'ETH',
            name: 'Ethereum',
            symbol: 'ETH',
            quantum,
            contractError: [],
          },
        ]
      }
      case ERC20_SELECTOR: {
        const address = getAddress(event)
        const inspected = await this.tokenInspector.inspectERC20(address)
        return [
          { assetTypeHash, type: 'ERC20', quantum, address, ...inspected },
          {
            assetHash: AssetHash(assetTypeHash.toString()),
            assetTypeHash,
            type: 'ERC20',
            quantum,
            address,
            ...inspected,
          },
        ]
      }
      case ERC721_SELECTOR: {
        const address = getAddress(event)
        const inspected = await this.tokenInspector.inspectERC721(address)
        return [
          { assetTypeHash, type: 'ERC721', quantum, address, ...inspected },
          undefined,
        ]
      }
      case ERC1155_SELECTOR: {
        const address = getAddress(event)
        // TODO: maybe special function for ERC1155
        const inspected = await this.tokenInspector.inspectERC20(address)
        return [
          { assetTypeHash, type: 'ERC1155', quantum, address, ...inspected },
          undefined,
        ]
      }
      case MINTABLE_ERC721_SELECTOR: {
        const address = getAddress(event)
        const inspected = await this.tokenInspector.inspectERC721(address)
        return [
          {
            assetTypeHash,
            type: 'MINTABLE_ERC721',
            quantum,
            address,
            ...inspected,
          },
          undefined,
        ]
      }
      case MINTABLE_ERC20_SELECTOR: {
        const address = getAddress(event)
        const inspected = await this.tokenInspector.inspectERC20(address)
        return [
          {
            assetTypeHash,
            type: 'MINTABLE_ERC20',
            quantum,
            address,
            ...inspected,
          },
          undefined,
        ]
      }
      default:
        throw new Error(`Unsupported asset selector: ${assetSelector}`)
    }
  }
}

function getAddress(event: RegistrationEvent) {
  return EthereumAddress(`0x${event.args.assetInfo.substring(34)}`)
}

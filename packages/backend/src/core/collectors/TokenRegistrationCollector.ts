import { ERCType, EthereumAddress, Hash256, SpotAssetId } from '@explorer/types'

import { BlockRange } from '../../model'
import { TokenRegistrationRepository } from '../../peripherals/database/TokenRegistrationRepository'
import {
  TokenRecord,
  TokenRepository,
} from '../../peripherals/database/TokenRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { TokenInspector } from '../../peripherals/ethereum/TokenInspector'
import { LogTokenRegistered } from './events'

export interface TokenRegistration {
  name: string
  assetId: Hash256
}

const ETH_ASSET_SELECTOR = '0x8322fff2'

export class TokenRegistrationCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly contractAddress: EthereumAddress,
    private readonly tokenRegistrationRepository: TokenRegistrationRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly tokenInspector: TokenInspector
  ) {}

  async collect(blockRange: BlockRange) {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.contractAddress.toString(),
      topics: [LogTokenRegistered.topic],
    })

    const tokens: TokenRecord[] = []

    const events = await Promise.all(
      logs.map(async (log) => {
        const event = LogTokenRegistered.parseLog(log)

        const assetSelector = event.args.assetInfo.substring(0, 10)
        // TODO: Maybe there is a better way to handle ETH token registration although it's a one time event
        const address =
          assetSelector === ETH_ASSET_SELECTOR
            ? EthereumAddress.fake()
            : EthereumAddress(`0x${event.args.assetInfo.substring(34)}`)
        const quantum = event.args.quantum
        const assetType = event.args.assetType.toString()

        const pushToTokens = () => {
          tokens.push({
            assetTypeHash: assetType,
            assetHash: SpotAssetId(assetType),
            tokenId: null,
            uri: null,
            contractError: [],
          })
        }

        const getAssetData = async (assetSelector: string) => {
          switch (assetSelector) {
            case ETH_ASSET_SELECTOR:
              pushToTokens()
              return {
                type: 'ETH' as ERCType,
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
                contractError: [],
              }
            case '0xf47261b0':
              pushToTokens()
              return {
                type: 'ERC-20' as ERCType,
                ...(await this.tokenInspector.inspectERC20(address)),
              }
            case '0x68646e2d':
              pushToTokens()
              return {
                type: 'MINTABLE_ERC-20' as ERCType,
                ...(await this.tokenInspector.inspectERC20(address)),
              }
            case '0x02571792':
              return {
                type: 'ERC-721' as ERCType,
                decimals: null,
                ...(await this.tokenInspector.inspectERC721(address)),
              }
            case '0x3348691d':
              return {
                type: 'ERC-1155' as ERCType,
                name: null,
                symbol: null,
                decimals: null,
                contractError: [],
              }
            case '0xb8b86672':
              return {
                type: 'MINTABLE_ERC-721' as ERCType,
                decimals: null,
                ...(await this.tokenInspector.inspectERC721(address)),
              }
            // TODO: Figure out a way to get rid of the default case
            default:
              return {
                type: 'ERC-20' as ERCType,
                name: null,
                symbol: null,
                decimals: null,
                contractError: [],
              }
          }
        }

        return {
          assetTypeHash: assetType,
          address,
          quantum,
          ...(await getAssetData(assetSelector)),
        }
      })
    )

    await this.tokenRegistrationRepository.addMany(events)
    await this.tokenRepository.addMany(tokens)

    return events
  }
}

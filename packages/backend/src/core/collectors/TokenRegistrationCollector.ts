import { ERCType, EthereumAddress, Hash256, SpotAssetId } from '@explorer/types'

import { BlockRange } from '../../model'
import { TokenRegistrationRepository } from '../../peripherals/database/TokenRegistrationRepository'
import {
  TokenRecord,
  TokenRepository,
} from '../../peripherals/database/TokenRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { getERC20Info } from './assetDataGetters/getERC20Info'
import { getERC721Info } from './assetDataGetters/getERC721Info'
import { LogTokenRegistered } from './events'

export interface TokenRegistration {
  name: string
  assetId: Hash256
}

export class TokenRegistrationCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly contractAddress: EthereumAddress,
    private readonly tokenRegistrationRepository: TokenRegistrationRepository,
    private readonly tokenRepository: TokenRepository
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

        const address = EthereumAddress(
          `0x${event.args.assetInfo.substring(34)}`
        )
        const quantum = event.args.quantum.toNumber()
        const assetType = event.args.assetType.toString()

        const pushToTokens = () => {
          tokens.push({
            assetTypeHash: assetType,
            assetHash: SpotAssetId(assetType),
            tokenId: null,
            uri: null,
            contractError: null,
          })
        }

        const getAssetData = async (assetSelector: string) => {
          switch (assetSelector) {
            case '0x8322fff2':
              pushToTokens()
              return {
                type: ERCType('ETH'),
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
                contractError: null,
              }
            case '0xf47261b0':
              pushToTokens()
              return {
                type: ERCType('ERC-20'),
                ...(await getERC20Info(address)),
              }
            case '0x68646e2d':
              pushToTokens()
              return {
                type: ERCType('MINTABLE_ERC-20'),
                ...(await getERC20Info(address)),
              }
            case '0x02571792':
              return {
                type: ERCType('ERC-721'),
                decimals: null,
                ...(await getERC721Info(address)),
              }
            case '0x3348691d':
              return {
                type: ERCType('ERC-1155'),
                name: null,
                symbol: null,
                decimals: null,
                contractError: null,
              }
            case '0xb8b86672':
              return {
                type: ERCType('MINTABLE_ERC-721'),
                decimals: null,
                ...(await getERC721Info(address)),
              }
            // TODO: Figure out a way to get rid of the default case
            default:
              return {
                type: ERCType('ERC-20'),
                name: null,
                symbol: null,
                decimals: null,
                contractError: null,
              }
          }
        }

        return {
          assetTypeHash: assetType,
          address,
          quantum,
          ...(await getAssetData(event.args.assetInfo.substring(0, 10))),
        }
      })
    )

    await this.tokenRegistrationRepository.addMany(events)
    await this.tokenRepository.addMany(tokens)

    return events
  }
}

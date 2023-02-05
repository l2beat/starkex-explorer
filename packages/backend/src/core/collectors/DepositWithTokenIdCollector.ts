import { EthereumAddress, SpotAssetId } from '@explorer/types'

import { BlockRange } from '../../model'
import { TokenRegistrationRepository } from '../../peripherals/database/TokenRegistrationRepository'
import { TokenRepository } from '../../peripherals/database/TokenRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { TokenInspector } from '../../peripherals/ethereum/TokenInspector'
import { LogDepositWithTokenId } from './events'

export class DepositWithTokenIdCollector {
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
      topics: [LogDepositWithTokenId.topic],
    })

    const events = await Promise.all(
      logs.map(async (log) => {
        const event = LogDepositWithTokenId.parseLog(log)

        const assetTypeHash = event.args.assetType.toString()

        const registeredToken =
          await this.tokenRegistrationRepository.findByAssetType(assetTypeHash)

        if (!registeredToken) {
          throw new Error('This token has never been registered D:')
        }

        const address = registeredToken.address
        const tokenId = event.args.tokenId
        const assetHash = event.args.assetId.toString()

        const base = {
          assetTypeHash,
          assetHash: SpotAssetId(assetHash),
          tokenId: tokenId.toString(),
        }

        switch (registeredToken.type.toString()) {
          case 'ERC-721':
          case 'MINTABLE_ERC-721':
            return {
              ...base,
              ...(await this.tokenInspector.getERC721URI(
                address,
                tokenId.toBigInt()
              )),
            }
          case 'ERC-1155':
            return {
              ...base,
              ...(await this.tokenInspector.getERC1155URI(
                address,
                tokenId.toBigInt()
              )),
            }
          // TODO: Fix the switch so we don't have to define a default value
          default:
            return {
              ...base,
              uri: null,
              contractError: [],
            }
        }
      })
    )

    await this.tokenRepository.addMany(events)

    return events
  }
}

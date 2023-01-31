import { EthereumAddress } from '@explorer/types'

import { BlockRange } from '../../model'
import { TokenRegistrationRepository } from '../../peripherals/database/TokenRegistrationRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { getERC721Info } from './assetDataGetters/getERC721Info'
import { getERC1155Info } from './assetDataGetters/getERC1155Info'
import { LogDepositWithTokenId } from './events'

export class LogDepositWithTokenIdEventsCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly contractAddress: EthereumAddress,
    private readonly tokenRegistrationRepository: TokenRegistrationRepository
  ) {}

  async collect(blockRange: BlockRange) {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.contractAddress.toString(),
      topics: [LogDepositWithTokenId.topic],
    })

    const events = logs.map(async (log) => {
      const event = LogDepositWithTokenId.parseLog(log)

      // Should we store assetType as bigint or string?
      const registeredToken =
        await this.tokenRegistrationRepository.findByAssetType(
          event.args.assetType.toString()
        )

      if (!registeredToken) {
        throw new Error('This token has never been registered D:')
      }

      const address = registeredToken.address
      const tokenId = event.args.tokenId

      const base = {
        type: registeredToken.type,
        address,
        quantum: 1,
        assetId: event.args.assetId.toString(),
        tokenId: tokenId.toString(),
      }

      switch (registeredToken.type) {
        case 'ERC-721':
        case 'MINTABLE_ERC-721':
          return {
            ...base,
            ...(await getERC721Info(address, tokenId.toBigInt())),
          }
        case 'ERC-1155':
          return {
            ...base,
            ...(await getERC1155Info(address, tokenId.toBigInt())),
          }
      }
    })

    return events
  }
}
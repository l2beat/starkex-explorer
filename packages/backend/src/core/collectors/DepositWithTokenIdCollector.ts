import { AssetHash, EthereumAddress, Hash256 } from '@explorer/types'

import { BlockRange } from '../../model'
import { ERC721Details, ERC1155Details, MintableERC721Details } from '../../model/AssetDetails'
import { AssetRepository } from '../../peripherals/database/AssetRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { TokenInspector } from '../../peripherals/ethereum/TokenInspector'
import { LogDepositWithTokenId } from './events'

export class DepositWithTokenIdCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly contractAddress: EthereumAddress,
    private readonly assetRepository: AssetRepository,
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

        const assetTypeHash = Hash256(event.args.assetType.toString())

        const registeredToken =
          await this.assetRepository.findRegistrationByAssetTypeHash(assetTypeHash)

        if (!registeredToken) {
          throw new Error('This token has never been registered D:')
        }

        const tokenId = event.args.tokenId.toBigInt()
        const assetHash = AssetHash(event.args.assetId.toString())
        const {type, quantum, address, name, symbol, decimals} = registeredToken

        if(!address) {
          throw new Error('Something went wrong with the registration')
        }

        switch (type) {
          case 'ERC721':
            return {
              assetHash,
              assetTypeHash,
              type: "ERC721",
              quantum,
              address,
              name,
              symbol,
              tokenId,
              ...(await this.tokenInspector.getERC721URI(
                address,
                tokenId
              )),
            } as ERC721Details // Is this conversion necessary?
          case 'MINTABLE_ERC721': //Will this type even appear here?
            return {
              assetHash,
              assetTypeHash,
              type: "MINTABLE_ERC721",
              quantum,
              address,
              name,
              symbol,
              mintingBlob: '',
              ...(await this.tokenInspector.getERC721URI(
                address,
                tokenId
              )),
            } as MintableERC721Details
          case 'ERC1155':
            return {
              assetHash,
              tokenId,
              assetTypeHash,
              quantum,
              address,
              name,
              symbol,
              decimals,
              type: "ERC1155",
              ...(await this.tokenInspector.getERC1155URI(
                address,
                tokenId
              )),
            } as ERC1155Details
          default:
            throw new Error('Unknown token type')
        }
      })
    )

    await this.assetRepository.addManyDetails(events)

    return events
  }
}

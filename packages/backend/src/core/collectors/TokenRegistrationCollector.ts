import { EthereumAddress, Hash256 } from '@explorer/types'

import { BlockRange } from '../../model'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { getERC20Info } from './assetDataGetters/getERC20Info'
import { LogTokenRegistered } from './events'

export interface TokenRegistration {
  name: string
  assetId: Hash256
}

export class TokenRegistrationCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly contractAddress: EthereumAddress
  ) {}

  async collect(blockRange: BlockRange) {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.contractAddress.toString(),
      topics: [LogTokenRegistered.topic],
    })

    const events = logs.map(async (log) => {
      const event = LogTokenRegistered.parseLog(log)

      const address = EthereumAddress(`0x${event.args.assetInfo.substring(34)}`)
      const quantum = event.args.quantum.toNumber()
      const assetType = event.args.assetType.toString() // true only for ERC-20 and ETH

      const getAssetData = async (assetSelector: string) => {
        switch (assetSelector) {
          case '0x8322fff2':
            return {
              type: 'ETH',
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            }
          case '0xf47261b0':
            return { type: 'ERC-20', ...(await getERC20Info(address)) }
          case '0x68646e2d':
            return { type: 'MINTABLE_ERC-20', ...(await getERC20Info(address)) }
          case '0x02571792':
            return { type: 'ERC-721', address, assetType }
          case '0x3348691d':
            return { type: 'ERC-1155', address, assetType }
          case '0xb8b86672':
            return { type: 'MINTABLE_ERC-721', address, assetType }
        }
      }

      return {
        assetType,
        address,
        quantum,
        ...(await getAssetData(event.args.assetInfo.substring(0, 10))),
      }
    })

    return events
  }
}

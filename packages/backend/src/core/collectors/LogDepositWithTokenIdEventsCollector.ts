import { EthereumAddress } from '@explorer/types'

import { BlockRange } from '../../model'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { LogDepositWithTokenId } from './events'

export interface DepositWithTokenId {
  assetId: number
  tokenId: number
}

export class LogDepositWithTokenIdEventsCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly contractAddress: EthereumAddress
  ) {}

  async collect(blockRange: BlockRange): Promise<DepositWithTokenId[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.contractAddress.toString(),
      topics: [LogDepositWithTokenId.topic],
    })

    const events = logs.map((log) => {
      const event = LogDepositWithTokenId.parseLog(log)

      return {
        assetId: event.args.assetId.toNumber(),
        tokenId: event.args.tokenId.toNumber(),
      }
    })

    return events
  }
}

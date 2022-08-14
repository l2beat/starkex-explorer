import { EthereumAddress, StarkKey } from '@explorer/types'

import { BlockRange } from '../../model/BlockRange'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../../peripherals/ethereum/types'
import { LogUserRegistered } from './events'

export interface UserRegistration {
  blockNumber: number
  ethAddress: EthereumAddress
  starkKey: StarkKey
}

export class UserRegistrationCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly userRegistrationRepository: UserRegistrationEventRepository,
    private readonly perpetualAddress: EthereumAddress
  ) {}

  async collect(blockRange: BlockRange): Promise<UserRegistration[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: this.perpetualAddress.toString(),
      topics: [LogUserRegistered.topic],
    })
    const events = logs.map((log) => {
      const event = LogUserRegistered.parseLog(log)
      return {
        blockNumber: log.blockNumber,
        ethAddress: EthereumAddress(event.args.ethKey),
        starkKey: StarkKey.from(event.args.starkKey),
      }
    })
    await this.userRegistrationRepository.addMany(events)
    return events
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.userRegistrationRepository.deleteAfter(lastToKeep)
  }
}

import { EthereumAddress, StarkKey } from '@explorer/types'
import { utils } from 'ethers'

import { BlockRange } from '../model/BlockRange'
import {
  UserRegistrationEventRecordCandidate,
  UserRegistrationEventRepository,
} from '../peripherals/database/UserRegistrationEventRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'

const PERPETUAL_ADDRESS = '0xD54f502e184B6B739d7D27a6410a67dc462D69c8'
const PERPETUAL_ABI = new utils.Interface([
  'event LogUserRegistered(address ethKey, uint256 starkKey, address sender)',
])

/** @internal exported only for tests */
export const LOG_USER_REGISTERED =
  PERPETUAL_ABI.getEventTopic('LogUserRegistered')

type UserRegistration = Omit<
  UserRegistrationEventRecordCandidate,
  'blockNumber'
>

export class UserRegistrationCollector {
  constructor(
    private readonly ethereumClient: EthereumClient,
    private readonly userRegistrationRepository: UserRegistrationEventRepository
  ) {}

  async collect(blockRange: BlockRange): Promise<UserRegistration[]> {
    const events = await this.getEvents(blockRange)
    await this.userRegistrationRepository.add(events)
    return events.map((e) => ({
      ethAddress: e.ethAddress,
      starkKey: e.starkKey,
    }))
  }

  private async getEvents(
    blockRange: BlockRange
  ): Promise<UserRegistrationEventRecordCandidate[]> {
    const logs = await this.ethereumClient.getLogsInRange(blockRange, {
      address: PERPETUAL_ADDRESS,
      topics: [LOG_USER_REGISTERED],
    })
    return logs.map((log) => {
      const event = PERPETUAL_ABI.parseLog(log)
      return {
        blockNumber: log.blockNumber,
        ethAddress: EthereumAddress(event.args.ethKey),
        starkKey: StarkKey.from(event.args.starkKey),
      }
    })
  }

  async discardAfter(lastToKeep: BlockNumber) {
    await this.userRegistrationRepository.deleteAllAfter(lastToKeep)
  }
}

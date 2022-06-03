import { EthereumAddress, PedersenHash, StarkKey } from '@explorer/types'

import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { ControllerResult } from './ControllerResult'

export class SearchController {
  constructor(
    private stateUpdateRepository: StateUpdateRepository,
    private positionRepository: PositionRepository,
    private userRegistrationEventRepository: UserRegistrationEventRepository
  ) {}

  async getSearchRedirect(query: string): Promise<ControllerResult> {
    const parsed = parseSearchQuery(query)

    let response: ControllerResult | undefined

    if (!response && parsed.ethereumAddress) {
      response = await this.searchForEthereumAddress(parsed.ethereumAddress)
    }

    if (!response && parsed.stateTreeHash) {
      response = await this.searchForRootHash(parsed.stateTreeHash)
    }

    if (!response && parsed.starkKey) {
      response = await this.searchForStarkKey(parsed.starkKey)
    }

    if (!response) {
      const content = "Search query couldn't be found"
      return { type: 'not found', content }
    }

    return response
  }

  private async searchForEthereumAddress(
    ethereumAddr: EthereumAddress
  ): Promise<ControllerResult | undefined> {
    const userRegistrationEvent =
      await this.userRegistrationEventRepository.findByEthereumAddress(
        ethereumAddr
      )
    if (userRegistrationEvent === undefined) {
      return
    }

    const positionId = await this.positionRepository.findIdByStarkKey(
      userRegistrationEvent.starkKey
    )
    if (positionId === undefined) {
      return
    }

    return { type: 'redirect', url: `/positions/${positionId}` }
  }

  private async searchForRootHash(
    hash: PedersenHash
  ): Promise<ControllerResult | undefined> {
    const stateUpdateId = await this.stateUpdateRepository.findIdByRootHash(
      hash
    )
    if (stateUpdateId === undefined) {
      return
    }

    return { type: 'redirect', url: `/state-updates/${stateUpdateId}` }
  }

  private async searchForStarkKey(
    starkKey: StarkKey
  ): Promise<ControllerResult | undefined> {
    const userRegistrationEvent =
      await this.userRegistrationEventRepository.findByStarkKey(starkKey)
    if (userRegistrationEvent === undefined) {
      return
    }

    const positionId = await this.positionRepository.findIdByStarkKey(
      userRegistrationEvent.starkKey
    )
    if (positionId === undefined) {
      return
    }

    return { type: 'redirect', url: `/positions/${positionId}` }
  }
}

interface ParsedQuery {
  ethereumAddress?: EthereumAddress
  stateTreeHash?: PedersenHash
  starkKey?: StarkKey
}

export function parseSearchQuery(query: string): ParsedQuery {
  const parsed: ParsedQuery = {}
  parsed.stateTreeHash = tryOrUndefined(() => PedersenHash(query))
  parsed.starkKey = tryOrUndefined(() => StarkKey(query))
  parsed.ethereumAddress = tryOrUndefined(() => EthereumAddress(query))

  return parsed
}

function tryOrUndefined<T>(fn: () => T): T | undefined {
  try {
    return fn()
  } catch {
    return undefined
  }
}

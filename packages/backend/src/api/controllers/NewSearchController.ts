import { EthereumAddress, PedersenHash, StarkKey } from '@explorer/types'

import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { ControllerResult } from './ControllerResult'

export class NewSearchController {
  constructor(
    private stateUpdateRepository: StateUpdateRepository,
    private positionRepository: PositionRepository,
    private userRegistrationEventRepository: UserRegistrationEventRepository
  ) {}

  async getSearchRedirect(query: string): Promise<ControllerResult> {
    console.log('query', query)
    const parsed = parseSearchQuery(query)

    let response: ControllerResult | undefined

    if (!response && parsed.ethereumAddress) {
      response = await this.searchForEthereumAddress(parsed.ethereumAddress)
    }

    if (!response && parsed.stateUpdateRootHash) {
      response = await this.searchForRootHash(parsed.stateUpdateRootHash)
    }

    if (!response && parsed.starkKey) {
      response = await this.searchForStarkKey(parsed.starkKey)
    }

    if (!response && parsed.positionId) {
      response = await this.searchForPositionId(parsed.positionId)
    }

    if (!response && parsed.stateUpdateId) {
      response = await this.searchForStateUpdateId(parsed.stateUpdateId)
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

    const starkKey = userRegistrationEvent.starkKey.toString()

    return { type: 'redirect', url: `/users/${starkKey}` }
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

  private async searchForPositionId(
    positionId: bigint
  ): Promise<ControllerResult | undefined> {
    const position = await this.positionRepository.findById(positionId)
    if (position === undefined) {
      return
    }

    const starkKey = position.starkKey.toString()

    return { type: 'redirect', url: `/user/${starkKey}` }
  }

  private async searchForStateUpdateId(
    stateUpdateId: number
  ): Promise<ControllerResult | undefined> {
    const stateUpdate = await this.stateUpdateRepository.findById(stateUpdateId)
    if (stateUpdate === undefined) {
      return
    }

    return { type: 'redirect', url: `/state-updates/${stateUpdateId}` }
  }
}

interface ParsedQuery {
  ethereumAddress?: EthereumAddress
  starkKey?: StarkKey
  positionId?: bigint
  stateUpdateId?: number
  stateUpdateRootHash?: PedersenHash
}

export function parseSearchQuery(query: string): ParsedQuery {
  const parsed: ParsedQuery = {}
  parsed.starkKey = tryOrUndefined(() => StarkKey(query))
  parsed.ethereumAddress = tryOrUndefined(() => EthereumAddress(query))
  parsed.positionId = query.startsWith('23')
    ? BigInt(query.slice(2))
    : undefined // 23 = #
  parsed.stateUpdateId = query.startsWith('40')
    ? parseInt(query.slice(2))
    : undefined // 40 = @
  parsed.stateUpdateRootHash = tryOrUndefined(() => PedersenHash(query))
  return parsed
}

function tryOrUndefined<T>(fn: () => T): T | undefined {
  try {
    return fn()
  } catch {
    return undefined
  }
}

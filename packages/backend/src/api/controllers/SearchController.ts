import {
  AssetHash,
  AssetId,
  EthereumAddress,
  PedersenHash,
  StarkKey,
} from '@explorer/types'

import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { VaultRepository } from '../../peripherals/database/VaultRepository'
import { ControllerResult } from './ControllerResult'

export class SearchController {
  constructor(
    private stateUpdateRepository: StateUpdateRepository,
    private positionOrVaultRepository: PositionRepository | VaultRepository,
    private userRegistrationEventRepository: UserRegistrationEventRepository,
    private preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository<
      AssetHash | AssetId
    >
  ) {}

  async getSearchRedirect(query: string): Promise<ControllerResult> {
    const parsed = parseSearchQuery(query.trim())

    let response: ControllerResult | undefined

    if (!response && parsed.ethereumAddress) {
      response = await this.searchForEthereumAddress(parsed.ethereumAddress)
    }

    if (!response && parsed.starkKey) {
      response = await this.searchForStarkKey(parsed.starkKey)
    }

    if (!response && parsed.positionOrVaultId) {
      response = await this.searchForPositionOrVaultId(parsed.positionOrVaultId)
    }

    if (!response && parsed.stateUpdateId) {
      response = await this.searchForStateUpdateId(parsed.stateUpdateId)
    }

    if (!response && parsed.stateUpdateRootHash) {
      response = await this.searchForRootHash(parsed.stateUpdateRootHash)
    }

    if (!response) {
      const content = 'No results found for your query'
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
    if (
      !(await this.preprocessedAssetHistoryRepository.starkKeyExists(starkKey))
    ) {
      return
    }

    return { type: 'redirect', url: `/users/${starkKey.toString()}` }
  }

  private async searchForPositionOrVaultId(
    positionOrVaultId: bigint
  ): Promise<ControllerResult | undefined> {
    const positionOrVault = await this.positionOrVaultRepository.findById(
      positionOrVaultId
    )
    if (positionOrVault === undefined) {
      return
    }

    const starkKey = positionOrVault.starkKey.toString()

    return { type: 'redirect', url: `/users/${starkKey}` }
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
  positionOrVaultId?: bigint
  stateUpdateId?: number
  stateUpdateRootHash?: PedersenHash
}

export function parseSearchQuery(query: string): ParsedQuery {
  const parsed: ParsedQuery = {}
  parsed.starkKey = tryOrUndefined(() => StarkKey(query))
  parsed.ethereumAddress = tryOrUndefined(() => EthereumAddress(query))
  parsed.positionOrVaultId = query.startsWith('#')
    ? BigInt(query.slice(1))
    : undefined
  parsed.stateUpdateId = query.startsWith('@')
    ? parseInt(query.slice(1))
    : undefined
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

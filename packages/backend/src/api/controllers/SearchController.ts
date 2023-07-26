import { assertUnreachable, TradingMode } from '@explorer/shared'
import { EthereumAddress, PedersenHash, StarkKey } from '@explorer/types'

import { L2TransactionRepository } from '../../peripherals/database/L2TransactionRepository'
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
    private preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository,
    private l2TransactionRepository: L2TransactionRepository,
    private tradingMode: TradingMode
  ) {}

  async getSearchRedirect(query: string): Promise<ControllerResult> {
    const parsed = parseSearchQuery(query.trim())

    if (!parsed) {
      return { type: 'not found', message: 'No results found for your query' }
    }

    switch (parsed.type) {
      case 'ethereumAddress':
        return await this.searchForEthereumAddress(parsed.ethereumAddress)
      case 'starkKey':
        return await this.searchForStarkKey(parsed.starkKey)
      case 'positionOrVaultId':
        return await this.searchForPositionOrVaultId(
          parsed.positionOrVaultId,
          this.tradingMode
        )
      case 'stateUpdateId':
        return await this.searchForStateUpdateId(parsed.stateUpdateId)
      case 'stateUpdateRootHash':
        return await this.searchForRootHash(parsed.stateUpdateRootHash)
      default:
        assertUnreachable(parsed)
    }
  }

  private async searchForEthereumAddress(
    ethereumAddress: EthereumAddress
  ): Promise<ControllerResult> {
    const userRegistrationEvent =
      await this.userRegistrationEventRepository.findByEthereumAddress(
        ethereumAddress
      )
    if (userRegistrationEvent === undefined) {
      return {
        type: 'not found',
        message: `No registered user with Ethereum address ${ethereumAddress.toString()} was found`,
      }
    }

    const starkKey = userRegistrationEvent.starkKey.toString()

    return { type: 'redirect', url: `/users/${starkKey}` }
  }

  private async searchForStarkKey(
    starkKey: StarkKey
  ): Promise<ControllerResult> {
    const assetHistoryExistsForStarkKey =
      await this.preprocessedAssetHistoryRepository.starkKeyExists(starkKey)

    const l2TransactionsExistForStarkKey =
      await this.l2TransactionRepository.starkKeyExists(starkKey)

    if (!assetHistoryExistsForStarkKey && !l2TransactionsExistForStarkKey) {
      return {
        type: 'not found',
        message: `No user with Stark key ${starkKey.toString()} was found`,
      }
    }

    return { type: 'redirect', url: `/users/${starkKey.toString()}` }
  }

  private async searchForRootHash(
    hash: PedersenHash
  ): Promise<ControllerResult> {
    const stateUpdateId = await this.stateUpdateRepository.findIdByRootHash(
      hash
    )
    if (stateUpdateId === undefined) {
      return {
        type: 'not found',
        message: `No state update with root hash ${hash.toString()} was found`,
      }
    }

    return { type: 'redirect', url: `/state-updates/${stateUpdateId}` }
  }

  private async searchForPositionOrVaultId(
    positionOrVaultId: bigint,
    tradingMode: TradingMode
  ): Promise<ControllerResult> {
    const positionOrVault = await this.positionOrVaultRepository.findById(
      positionOrVaultId
    )
    if (positionOrVault === undefined) {
      return {
        type: 'not found',
        message: `No ${
          tradingMode === 'perpetual' ? 'position' : 'vault'
        } ID #${positionOrVaultId} was found`,
      }
    }

    const starkKey = positionOrVault.starkKey.toString()

    return { type: 'redirect', url: `/users/${starkKey}` }
  }

  private async searchForStateUpdateId(
    stateUpdateId: number
  ): Promise<ControllerResult> {
    const stateUpdate = await this.stateUpdateRepository.findById(stateUpdateId)
    if (stateUpdate === undefined) {
      return {
        type: 'not found',
        message: `No state update with ID ${stateUpdateId} was found`,
      }
    }

    return { type: 'redirect', url: `/state-updates/${stateUpdateId}` }
  }
}

type ParsedQuery =
  | {
      type: 'ethereumAddress'
      ethereumAddress: EthereumAddress
    }
  | {
      type: 'starkKey'
      starkKey: StarkKey
    }
  | {
      type: 'positionOrVaultId'
      positionOrVaultId: bigint
    }
  | {
      type: 'stateUpdateId'
      stateUpdateId: number
    }
  | {
      type: 'stateUpdateRootHash'
      stateUpdateRootHash: PedersenHash
    }

export function parseSearchQuery(query: string): ParsedQuery | undefined {
  const starkKey = tryOrUndefined(() => StarkKey(query))
  if (starkKey) {
    return {
      type: 'starkKey',
      starkKey,
    }
  }

  const ethereumAddress = tryOrUndefined(() => EthereumAddress(query))
  if (ethereumAddress) {
    return {
      type: 'ethereumAddress',
      ethereumAddress,
    }
  }

  const positionOrVaultId = query.startsWith('#')
    ? BigInt(query.slice(1))
    : undefined
  if (positionOrVaultId) {
    return {
      type: 'positionOrVaultId',
      positionOrVaultId,
    }
  }

  const stateUpdateId = query.startsWith('@')
    ? parseInt(query.slice(1))
    : undefined

  if (stateUpdateId) {
    return {
      type: 'stateUpdateId',
      stateUpdateId,
    }
  }

  const stateUpdateRootHash = tryOrUndefined(() => PedersenHash(query))
  if (stateUpdateRootHash) {
    return {
      type: 'stateUpdateRootHash',
      stateUpdateRootHash,
    }
  }
}

function tryOrUndefined<T>(fn: () => T): T | undefined {
  try {
    return fn()
  } catch {
    return undefined
  }
}

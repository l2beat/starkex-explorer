import { PedersenHash } from '@explorer/crypto'
import { decodeOnChainData } from '@explorer/encoding'
import { Position, RollupState } from '@explorer/state'

import { BlockRange } from '../model'
import { PageRepository } from '../peripherals/database/PageRepository'
import { RollupStateRepository } from '../peripherals/database/RollupStateRepository'
import {
  PositionRecord,
  StateUpdateRepository,
} from '../peripherals/database/StateUpdateRepository'
import { EthereumClient } from '../peripherals/ethereum/EthereumClient'
import { BlockNumber } from '../peripherals/ethereum/types'
import { Logger } from '../tools/Logger'
import { MemoryHashEventCollector } from './MemoryHashEventCollector'
import { PageCollector } from './PageCollector'
import { StateTransitionFactCollector } from './StateTransitionFactCollector'
import { VerifierCollector } from './VerifierCollector'

// Same as `await RollupState.empty().then(empty => empty.positions.hash())`
const ROLLUP_STATE_EMPTY_HASH = PedersenHash(
  '52ddcbdd431a044cf838a71d194248640210b316d7b1a568997ecad9dec9626'
)

export class DataSyncService {
  constructor(
    private readonly verifierCollector: VerifierCollector,
    private readonly memoryHashEventCollector: MemoryHashEventCollector,
    private readonly pageCollector: PageCollector,
    private readonly stateTransitionFactCollector: StateTransitionFactCollector,
    private readonly pageRepository: PageRepository,
    private readonly rollupStateRepository: RollupStateRepository,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly ethereumClient: EthereumClient,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  private rollupState?: RollupState

  async sync(blockRange: BlockRange) {
    const verifiers = await this.verifierCollector.collect(blockRange)
    const hashEvents = await this.memoryHashEventCollector.collect(
      blockRange,
      verifiers
    )
    const pageRecords = await this.pageCollector.collect(blockRange)
    const stateTransitionFacts =
      await this.stateTransitionFactCollector.collect(blockRange)

    this.logger.info({
      method: 'sync',
      blockRange: { from: blockRange.start, to: blockRange.end },
      newVerifiers: verifiers.map(String),
      newHashEventsCount: hashEvents.length,
      newPageRecords: pageRecords.length,
      newStateTransitionFacts: stateTransitionFacts.length,
    })

    const stateTransitions = await this.pageRepository.getAllForFacts(
      stateTransitionFacts.map((f) => f.hash)
    )

    let { oldHash, id } = await this.readLastUpdate()
    let rollupState = await this.ensureRollupState(oldHash)

    let i = 0
    for (const { factHash, pages } of stateTransitions) {
      const blockNumber = stateTransitionFacts[i].blockNumber

      const { timestamp } = await this.ethereumClient.getBlock(blockNumber)

      const decoded = decodeOnChainData(pages)

      let newPositions: { index: bigint; value: Position }[]
      ;[rollupState, newPositions] = await rollupState.update(decoded)
      this.rollupState = rollupState

      const rootHash = await rollupState.positions.hash()
      await this.stateUpdateRepository.add({
        stateUpdate: {
          id: ++id,
          blockNumber,
          factHash,
          rootHash,
          timestamp,
        },
        positions: newPositions.map(
          ({ value, index }): PositionRecord => ({
            positionId: Number(index), // @todo This isn't correct, right? How do I get `positionId`?
            publicKey: value.publicKey,
            balances: value.assets,
            collateralBalance: value.collateralBalance,
          })
        ),
        prices: decoded.newState.oraclePrices,
      })

      i++
    }
  }

  async discardAfter(blockNumber: BlockNumber) {
    await this.verifierCollector.discardAfter(blockNumber)
    await this.memoryHashEventCollector.discardAfter(blockNumber)
    await this.pageCollector.discardAfter(blockNumber)
    await this.stateTransitionFactCollector.discardAfter(blockNumber)
    await this.stateUpdateRepository.deleteAllAfter(blockNumber)
  }

  private async readLastUpdate() {
    let oldHash: PedersenHash
    let id: number

    const lastUpdate = await this.stateUpdateRepository.getLast()

    if (lastUpdate) {
      ;({ rootHash: oldHash, id } = lastUpdate)
    } else {
      oldHash = ROLLUP_STATE_EMPTY_HASH
      id = 0
    }

    return { oldHash, id }
  }

  private async ensureRollupState(oldHash: PedersenHash) {
    if (!this.rollupState) {
      this.rollupState = RollupState.recover(
        this.rollupStateRepository,
        oldHash
      )
    } else if ((await this.rollupState.positions.hash()) !== oldHash) {
      this.rollupState = RollupState.recover(
        this.rollupStateRepository,
        oldHash
      )
    }
    return this.rollupState
  }
}

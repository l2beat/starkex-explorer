import { decodeOnChainData, OnChainData } from '@explorer/encoding'

import { KeyValueStore } from '../../peripherals/database/KeyValueStore'
import type { PositionUpdateRepository } from '../../peripherals/database/PositionUpdateRepository'
import {
  VerifierRecord,
  VerifierRepository,
} from '../../peripherals/database/VerifierRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { BigNumber, BlockRange } from '../../peripherals/ethereum/types'
import { Cache } from '../../peripherals/FileSystemCache'
import { getOnChainData, PAGE_ABI } from '../../peripherals/todo/getOnChainData'
import { JobQueue } from '../../tools/JobQueue'
import type { Logger } from '../../tools/Logger'
import type { SafeBlockService } from '../SafeBlockService'
import { getFacts } from './getFacts'
import { getGpsVerifiers } from './getGpsVerifiers'
import { getMemoryHashEvents, MemoryHashEvent } from './getMemoryHashEvents'
import { getMemoryPageEvents } from './getMemoryPageEvents'
import { GetLogs } from './types'

// @todo Question: Why is this block hash important?
const BLOCK_HASH =
  '0x46c212912be05a090a9300cf87fd9434b8e8bbca15878d070ba83375a5dbaebd'

// block of the first verifier deploy
// Should we use 12013702 instead? (latest known verifier)
const EARLIEST_BLOCK = 11813207

export class ChainDataCollector {
  constructor(
    private readonly positionUpdateRepository: PositionUpdateRepository,
    private readonly verifierRepository: VerifierRepository,
    private readonly safeBlockService: SafeBlockService,
    private readonly ethereumClient: EthereumClient,
    private readonly kvStore: KeyValueStore,
    private readonly logger: Logger,
    private readonly cache: Cache
  ) {
    this.logger = logger.for(this)
  }

  private readonly jobQueue: JobQueue = new JobQueue(
    { maxConcurrentJobs: 1 },
    this.logger
  )

  // async savePositionsToDatabase() {
  //   const data = await this.getData()
  //   await this.positionUpdateRepository.addOrUpdate(data.positions)
  //   this.logger.info('Saved positions to database')
  // }

  async start() {
    const unsubscribe = this.safeBlockService.onNewSafeBlock((block) => {
      this.jobQueue.add({
        name: block.blockNumber.toString(),
        execute: async () => {
          const from = await this.getLastBlockNumberSynced()
          return await this.sync({ from, to: block.blockNumber })
        },
      })
    })
    return unsubscribe
  }

  // #region @todo remove this
  private _data?: OnChainData
  private async getData() {
    if (this._data) return this._data

    this.logger.info('Fetching onchain data')

    const data = await getOnChainData(BLOCK_HASH)
    const decoded = decodeOnChainData(data.map((page) => page.join('')))

    return (this._data = decoded)
  }
  // #endregion @todo remove this

  private async getVerifiers(to: BlockNumber) {
    const oldVerifiers = await this.verifierRepository.getAll()
    const lastVerifierUpgradeBlock = Math.max(
      EARLIEST_BLOCK,
      ...oldVerifiers.map((x) => x.blockNumber)
    )

    const newVerifiers = await getGpsVerifiers(
      (filter) => this.ethereumClient.getLogs(filter),
      { from: lastVerifierUpgradeBlock, to }
    )

    await this.verifierRepository.addOrUpdate(newVerifiers)

    const newVerifierAddresses = new Set(newVerifiers.map((x) => x.address))
    return [
      ...oldVerifiers.filter((v) => !newVerifierAddresses.has(v.address)),
      ...newVerifiers,
    ]
  }

  private async sync(blockRange: BlockRange): Promise<void> {
    const verifiers = this.getVerifiers(blockRange.to)
    const getLogs: GetLogs = (filter) => this.ethereumClient.getLogs(filter)

    // ?? await this.getEvents(verifiers, blockRange)
    const memoryPageEvents = await getMemoryPageEvents(
      getLogs,
      blockRange,
      this.cache
    )
    const memoryHashEvents: MemoryHashEvent[] = []
    for (const verifier of await verifiers) {
      const events = await getMemoryHashEvents(
        getLogs,
        verifier.address,
        blockRange,
        this.cache
      )
      memoryHashEvents.push(...events)
    }

    const facts = await getFacts(getLogs, BLOCK_HASH)

    const mpMap = new Map(
      memoryPageEvents.map((x) => [x.memoryHash, x.transactionHash])
    )
    const transactionHashes = facts
      .flatMap(
        (fact) =>
          memoryHashEvents.find((x) => x.factHash === fact)?.pagesHashes ?? []
      )
      .map((x) => mpMap.get(x))

    console.log('>>', { memoryHashEvents, memoryPageEvents, transactionHashes })

    // ?? await this.decodeTransactions(transactionHashes)
    const pages: BigNumber[][] = []
    for (const hash of transactionHashes) {
      if (!hash) {
        continue
      }
      const tx = await this.ethereumClient.getTransaction(hash)
      const decoded = PAGE_ABI.decodeFunctionData(
        'registerContinuousMemoryPage',
        tx.data
      )
      pages.push(decoded[1])
    }
    const result = pages.map((page) =>
      page.map((x) => x.toHexString().substring(2).padStart(64, '0'))
    )

    console.log({ result })

    // @todo
    // const data = parseOnChainData(events)
    // db.saveData(data)

    await this.setLastBlockNumberSynced(blockRange.to)
  }

  // @todo discuss this with @sz-piotr -- how will this be deployed? one long-running process?
  private _lastBlockNumberSynced: BlockNumber | undefined
  private async getLastBlockNumberSynced() {
    if (this._lastBlockNumberSynced !== undefined) {
      return this._lastBlockNumberSynced
    }

    const valueInDb = await this.kvStore.get('lastBlockNumberSynced')
    this._lastBlockNumberSynced =
      (valueInDb && parseInt(valueInDb)) || EARLIEST_BLOCK

    return this._lastBlockNumberSynced
  }
  private async setLastBlockNumberSynced(blockNumber: BlockNumber) {
    this._lastBlockNumberSynced = blockNumber
    await this.kvStore.set('lastBlockNumberSynced', String(blockNumber))
  }
}

type BlockNumber = number

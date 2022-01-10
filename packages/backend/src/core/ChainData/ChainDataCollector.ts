import { decodeOnChainData, OnChainData } from '@explorer/encoding'

import type { PositionUpdateRepository } from '../../peripherals/database/PositionUpdateRepository'
import { VerifierRepository } from '../../peripherals/database/VerifierRepository'
import { EthereumClient } from '../../peripherals/ethereum/EthereumClient'
import { BlockTag } from '../../peripherals/ethereum/types'
import { getOnChainData } from '../../peripherals/todo/getOnChainData'
import { JobQueue } from '../../tools/JobQueue'
import type { Logger } from '../../tools/Logger'
import type { SafeBlockService } from '../SafeBlockService'
import { getGpsVerifiers } from './getGpsVerifiers'

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
    private readonly jobQueue: JobQueue,
    private readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

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
          return await this.sync(from, block.blockNumber)
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

  private async sync(from: BlockNumber, to: BlockNumber) {
    const verifiers = await this.getVerifiers(to)

    // const oldVerifiers = db.getExistingVerifiers(to)
    // const newVerifiers = blockchain.getVerifierChanges(from, to)
    // db.saveVerifiers(from, to, newVerifiers)
    // const verifiers = [...oldVerifiers, ...newVerifiers]
    // const events = blockchain.getEvents(verifiers, from, to)
    // const data = parseOnChainData(events)
    // db.saveData(data)

    await this.setLastBlockNumberSynced(to)
  }

  private _lastBlockNumberSynced: BlockNumber | undefined // assuming long-running process, otherwise we should move it to redis or sth like that
  private async getLastBlockNumberSynced() {
    if (this._lastBlockNumberSynced !== undefined) {
      return this._lastBlockNumberSynced
    }
    // @todo this._lastBlockNumberSynced = await this.db.getLastBlockNumberSynced()
    return this._lastBlockNumberSynced || EARLIEST_BLOCK
  }
  private async setLastBlockNumberSynced(blockNumber: BlockNumber) {
    this._lastBlockNumberSynced = blockNumber
    // @todo await this.db.setLastBlockNumberSynced(blockNumber)
  }
}

type BlockNumber = number

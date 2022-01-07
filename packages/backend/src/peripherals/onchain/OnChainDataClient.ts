import { decodeOnChainData, OnChainData } from '@explorer/encoding'

import type { Logger } from '../../tools/Logger'
import type { PositionUpdateRepository } from '../database/PositionUpdateRepository'
import { getOnChainData } from './data/getOnChainData'

const BLOCK_HASH =
  '0x46c212912be05a090a9300cf87fd9434b8e8bbca15878d070ba83375a5dbaebd'

export class OnChainDataClient {
  constructor(
    private readonly positionUpdateRepository: PositionUpdateRepository,
    readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  async savePositionsToDatabase() {
    const data = await this.getData()
    await this.positionUpdateRepository.addOrUpdate(data.positions)
    this.logger.info('Saved positions to database')
  }

  _data?: OnChainData
  private async getData() {
    if (this._data) return this._data

    this.logger.info('Fetching onchain data')

    const data = await getOnChainData(BLOCK_HASH)
    const decoded = decodeOnChainData(data.map((page) => page.join('')))

    return (this._data = decoded)
  }
}

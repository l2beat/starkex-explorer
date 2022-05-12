import { Knex } from 'knex'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './BaseRepository'

export class PositionRepository extends BaseRepository {
  constructor(knex: Knex, logger: Logger) {
    super(knex, logger)
    this.count = this.wrapAny(this.count)
  }

  async count() {
    const [{ count }] = await this.knex('positions').countDistinct({
      count: 'position_id',
    })
    return count ? BigInt(count) : 0n
  }
}

import {
  IRollupStateStorage,
  MerkleNode,
  NodeOrLeaf,
  PositionLeaf,
} from '@explorer/state'
import { PedersenHash } from '@explorer/types'
import { partition } from 'lodash'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

export class RollupStateRepository
  extends BaseRepository
  implements IRollupStateStorage
{
  constructor(database: Database, logger: Logger) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */

    this.persist = this.wrapAny(this.persist)
    this.recover = this.wrapAny(this.recover)
    this.deleteAll = this.wrapDelete(this.deleteAll)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async persist(values: NodeOrLeaf<PositionLeaf>[]): Promise<void> {
    const [nodes, positions] = partition(
      values,
      (x): x is MerkleNode<PositionLeaf> => x instanceof MerkleNode
    )

    const [nodeRows, positionRows] = await Promise.all([
      Promise.all(
        nodes.map(async (x) => ({
          hash: (await x.hash()).toString(),
          left_hash: (await x.leftHash()).toString(),
          right_hash: (await x.rightHash()).toString(),
        }))
      ),
      Promise.all(
        positions.map(async (x) => ({
          hash: (await x.hash()).toString(),
          data: x.toJSON(),
        }))
      ),
    ])

    const filteredNodeRows = nodeRows.filter(
      (x, i, a) => a.findIndex((y) => x.hash === y.hash) === i
    )
    const filteredPositionRows = positionRows.filter(
      (x, i, a) => a.findIndex((y) => x.hash === y.hash) === i
    )

    const knex = await this.knex()
    const queries = []
    if (filteredNodeRows.length > 0) {
      queries.push(
        knex('merkle_nodes').insert(filteredNodeRows).onConflict('hash').merge()
      )
    }
    if (filteredPositionRows.length > 0) {
      queries.push(
        knex('merkle_positions')
          .insert(filteredPositionRows)
          .onConflict('hash')
          .merge()
      )
    }

    await Promise.all(queries)
  }

  async recover(hash: PedersenHash): Promise<NodeOrLeaf<PositionLeaf>> {
    const knex = await this.knex()
    const [node, position] = await Promise.all([
      knex('merkle_nodes')
        .first('hash', 'left_hash', 'right_hash')
        .where('hash', hash.toString()),
      knex('merkle_positions')
        .first('hash', 'data')
        .where('hash', hash.toString()),
    ])
    if (node) {
      return new MerkleNode(
        this,
        PedersenHash(node.left_hash),
        PedersenHash(node.right_hash),
        PedersenHash(node.hash)
      )
    } else if (position) {
      return PositionLeaf.fromJSON(position.data, PedersenHash(position.hash))
    } else {
      throw new Error(`Cannot find node or position: ${hash.toString()}`)
    }
  }

  async deleteAll() {
    const knex = await this.knex()
    const [a, b, c] = await Promise.all([
      knex('merkle_nodes').delete(),
      knex('merkle_positions').delete(),
      knex('rollup_parameters').delete(),
    ])
    return a + b + c
  }
}

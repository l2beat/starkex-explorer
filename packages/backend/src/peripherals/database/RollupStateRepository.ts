import { PedersenHash } from '@explorer/crypto'
import {
  IRollupStateStorage,
  MerkleNode,
  NodeOrLeaf,
  Position,
  RollupParameters,
} from '@explorer/state'
import { Knex } from 'knex'
import { partition } from 'lodash'

import { Logger } from '../../tools/Logger'

export class RollupStateRepository implements IRollupStateStorage {
  constructor(private knex: Knex, private logger: Logger) {
    this.logger = logger.for(this)
  }

  async getParameters(rootHash: PedersenHash): Promise<RollupParameters> {
    throw new Error('Method not implemented.')
  }

  async setParameters(
    rootHash: PedersenHash,
    values: RollupParameters
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async persist(values: NodeOrLeaf<Position>[]): Promise<void> {
    const [nodes, positions] = partition(
      values,
      (x): x is MerkleNode<Position> => x instanceof MerkleNode
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

    const queries = []
    if (nodeRows.length > 0) {
      queries.push(
        this.knex('merkle_nodes').insert(nodeRows).onConflict('hash').merge()
      )
    }
    if (positionRows.length > 0) {
      queries.push(
        this.knex('merkle_positions')
          .insert(positionRows)
          .onConflict('hash')
          .merge()
      )
    }

    await Promise.all(queries)

    this.logger.debug({
      method: 'persist',
      nodes: nodeRows.length,
      positions: positionRows.length,
    })
  }

  async recover(hash: PedersenHash): Promise<NodeOrLeaf<Position>> {
    const [node, position] = await Promise.all([
      this.knex('merkle_nodes')
        .first('hash', 'left_hash', 'right_hash')
        .where('hash', hash.toString()),
      this.knex('merkle_positions')
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
      return Position.fromJSON(position.data, PedersenHash(position.hash))
    } else {
      throw new Error(`Cannot find node or position: ${hash}`)
    }
  }

  async deleteAll() {
    await Promise.all([
      this.knex('merkle_nodes').delete(),
      this.knex('merkle_positions').delete(),
      this.knex('rollup_parameters').delete(),
    ])
    this.logger.debug({ method: 'deleteAll' })
  }
}

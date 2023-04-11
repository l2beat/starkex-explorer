import {
  IMerkleStorage,
  MerkleNode,
  MerkleValue,
  NodeOrLeaf,
} from '@explorer/state'
import { json, PedersenHash } from '@explorer/types'
import partition from 'lodash/partition'

import { Logger } from '../../tools/Logger'
import { BaseRepository } from './shared/BaseRepository'
import { Database } from './shared/Database'

type MerkleLeaf = MerkleValue & { toJSON(): json }
interface MerkleLeafClass<T extends MerkleLeaf> {
  EMPTY: T
  fromJSON(json: json, hash: PedersenHash): T
}

export class MerkleTreeRepository<T extends MerkleLeaf>
  extends BaseRepository
  implements IMerkleStorage<T>
{
  constructor(
    database: Database,
    logger: Logger,
    readonly Leaf: MerkleLeafClass<T>
  ) {
    super(database, logger)

    /* eslint-disable @typescript-eslint/unbound-method */
    this.persist = this.wrapAny(this.persist)
    this.recover = this.wrapAny(this.recover)
    this.deleteAll = this.wrapDelete(this.deleteAll)

    /* eslint-enable @typescript-eslint/unbound-method */
  }

  async persist(values: NodeOrLeaf<T>[]): Promise<void> {
    const [nodes, leaves] = partition(
      values,
      (x): x is MerkleNode<T> => x instanceof MerkleNode
    )

    const [nodeRows, leafRows] = await Promise.all([
      Promise.all(
        nodes.map(async (x) => ({
          hash: (await x.hash()).toString(),
          left_hash: (await x.leftHash()).toString(),
          right_hash: (await x.rightHash()).toString(),
        }))
      ),
      Promise.all(
        leaves.map(async (x) => ({
          hash: (await x.hash()).toString(),
          data: x.toJSON(),
        }))
      ),
    ])

    const filteredNodeRows = nodeRows.filter(
      (x, i, a) => a.findIndex((y) => x.hash === y.hash) === i
    )
    const filteredLeafRows = leafRows.filter(
      (x, i, a) => a.findIndex((y) => x.hash === y.hash) === i
    )

    const knex = await this.knex()
    const queries = []
    if (filteredNodeRows.length > 0) {
      queries.push(
        knex('merkle_nodes').insert(filteredNodeRows).onConflict('hash').merge()
      )
    }
    if (filteredLeafRows.length > 0) {
      queries.push(
        knex('merkle_leaves')
          .insert(filteredLeafRows)
          .onConflict('hash')
          .merge()
      )
    }

    await Promise.all(queries)
  }

  async recover(hash: PedersenHash): Promise<NodeOrLeaf<T>> {
    const knex = await this.knex()
    const [node, leaf] = await Promise.all([
      knex('merkle_nodes')
        .first('hash', 'left_hash', 'right_hash')
        .where('hash', hash.toString()),
      knex('merkle_leaves')
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
    } else if (leaf) {
      return this.Leaf.fromJSON(leaf.data, hash)
    } else {
      throw new Error(`Cannot find node or leaf: ${hash.toString()}`)
    }
  }

  async deleteAll() {
    const knex = await this.knex()
    const [a, b, c] = await Promise.all([
      knex('merkle_nodes').delete(),
      knex('merkle_leaves').delete(),
      knex('rollup_parameters').delete(),
    ])
    return a + b + c
  }
}

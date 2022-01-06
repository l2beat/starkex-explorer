import KnexConstructor, { Knex } from 'knex'
import path from 'path'
import { types as pgTypes } from 'pg'

import { Logger } from '../../tools/Logger'

export class DatabaseService {
  private migrated = false
  private version: string | null = null

  constructor(private knex: Knex, private logger: Logger) {
    this.logger = this.logger.for(this)
  }

  static createKnexInstance(databaseUrl: string) {
    return KnexConstructor({
      client: 'pg',
      connection: databaseUrl,
      migrations: {
        directory: path.join(__dirname, 'migrations'),
        extension: 'ts',
        loadExtensions: ['.ts'],
      },
    })
  }

  getStatus() {
    return { migrated: this.migrated, version: this.version }
  }

  async migrateToLatest() {
    await this.knex.migrate.latest()
    const version = await this.knex.migrate.currentVersion()
    this.migrated = true
    this.version = version
    this.logger.info('Migrations completed', { version })
  }

  async rollbackAll() {
    this.migrated = false
    this.version = null
    await this.knex.migrate.rollback(undefined, true)
  }

  async closeConnection() {
    await this.knex.destroy()
    this.logger.debug('Connection closed')
  }
}

/**
 * node-postgres returns bigints as strings since 2013.
 * @see https://github.com/brianc/node-postgres/pull/353
 * We set a parser here, to inform pg-types BigInt is supported in Node :)
 * `20` is the id of 8-bytes {@link pgTypes.TypeId.INT8}
 */
pgTypes.setTypeParser(20, 'text', BigInt)

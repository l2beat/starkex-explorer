import KnexConstructor, { Knex } from 'knex'
import path from 'path'
import { types as pgTypes } from 'pg'

import { Logger } from '../../../tools/Logger'
import { PolyglotMigrationSource } from './PolyglotMigrationSource'

export class Database {
  private knex: Knex
  private migrated = false
  private version: string | null = null
  private onMigrationsComplete: () => void = () => {}
  private migrationsComplete = new Promise<void>((resolve) => {
    this.onMigrationsComplete = resolve
  })

  constructor(connection: Knex.Config['connection'], private logger: Logger) {
    this.logger = this.logger.for(this)
    /**
     * node-postgres returns bigints as strings since 2013.
     * @see https://github.com/brianc/node-postgres/pull/353
     * We set a parser here, to inform pg-types BigInt is supported in Node :)
     * `20` is the id of 8-bytes {@link pgTypes.TypeId.INT8}
     */
    pgTypes.setTypeParser(20, 'text', BigInt)
    this.knex = KnexConstructor({
      client: 'pg',
      connection,
      migrations: {
        migrationSource: new PolyglotMigrationSource(
          path.join(__dirname, '..', 'migrations')
        ),
      },
    })
  }

  async getKnex(trx?: Knex.Transaction) {
    if (!this.migrated) {
      await this.migrationsComplete
    }
    return trx ?? this.knex
  }

  getStatus() {
    return { migrated: this.migrated, version: this.version }
  }

  skipMigrations() {
    this.onMigrationsComplete()
    this.migrated = true
  }

  async migrateToLatest() {
    await this.knex.migrate.latest()
    const version = await this.knex.migrate.currentVersion()
    this.version = version
    this.onMigrationsComplete()
    this.migrated = true
    this.logger.info('Migrations completed', { version })
  }

  async rollbackAll() {
    this.migrated = false
    this.version = null
    await this.knex.migrate.rollback(undefined, true)
    this.logger.info('Migrations rollback completed')
  }

  async closeConnection() {
    await this.knex.destroy()
    this.logger.debug('Connection closed')
  }
}

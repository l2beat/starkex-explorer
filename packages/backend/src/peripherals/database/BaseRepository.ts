import { Knex } from 'knex'

import { Logger } from '../../tools/Logger'

interface AddMethod<T> {
  (record: T): Promise<number>
}

interface AddManyMethod<T> {
  (records: T[]): Promise<number[]>
}

interface GetMethod<A extends unknown[], T> {
  (...args: A): Promise<T[]>
}

interface FindMethod<A extends unknown[], T> {
  (...args: A): Promise<T | undefined>
}

interface DeleteMethod<A extends unknown[]> {
  (...args: A): Promise<number>
}

export class BaseRepository {
  constructor(protected knex: Knex, protected logger: Logger) {
    this.logger = logger.for(this)
  }

  wrapAdd<T>(method: AddMethod<T>): AddMethod<T> {
    return async (value: T) => {
      const id = await method.call(this, value)
      this.logger.debug({ method: method.name, id: id })
      return id
    }
  }

  wrapAddMany<T>(method: AddManyMethod<T>): AddManyMethod<T> {
    return async (records: T[]) => {
      if (records.length === 0) {
        this.logger.debug({ method: method.name, count: 0 })
        return []
      }
      const ids = await method.call(this, records)
      this.logger.debug({ method: method.name, count: ids.length })
      return ids
    }
  }

  wrapGet<A extends unknown[], T>(method: GetMethod<A, T>): GetMethod<A, T> {
    return async (...args: A) => {
      const records = await method.call(this, ...args)
      this.logger.debug({ method: method.name, count: records.length })
      return records
    }
  }

  wrapFind<A extends unknown[], T>(method: FindMethod<A, T>): FindMethod<A, T> {
    return async (...args: A) => {
      const record = await method.call(this, ...args)
      this.logger.debug({ method: method.name, count: record ? 1 : 0 })
      return record
    }
  }

  wrapDelete<A extends unknown[]>(method: DeleteMethod<A>): DeleteMethod<A> {
    return async (...args: A) => {
      const count = await method.call(this, ...args)
      this.logger.debug({ method: method.name, count })
      return count
    }
  }
}

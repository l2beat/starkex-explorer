import { Knex } from 'knex'

import { Logger } from '../../tools/Logger'

interface AnyMethod<A extends unknown[], R> {
  (...args: A): Promise<R>
}

interface AddMethod<T, R> {
  (record: T): Promise<R>
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
  constructor(
    protected readonly knex: Knex,
    protected readonly logger: Logger
  ) {
    this.logger = logger.for(this)
  }

  protected wrapAny<A extends unknown[], R>(
    method: AnyMethod<A, R>
  ): AnyMethod<A, R> {
    return this.wrap(method, () => this.logger.debug({ method: method.name }))
  }

  protected wrapAdd<T, R extends number | string | string | number>(
    method: AddMethod<T, R>
  ): AddMethod<T, R> {
    return this.wrap(method, (id) =>
      this.logger.debug({ method: method.name, id: id.toString() })
    )
  }

  protected wrapAddMany<T>(method: AddManyMethod<T>): AddManyMethod<T> {
    const fn = async (records: T[]) => {
      if (records.length === 0) {
        this.logger.debug({ method: method.name, count: 0 })
        return []
      }
      const ids = await method.call(this, records)
      this.logger.debug({ method: method.name, count: ids.length })
      return ids
    }
    Object.defineProperty(fn, 'name', { value: method.name })
    return fn
  }

  protected wrapGet<A extends unknown[], T>(
    method: GetMethod<A, T>
  ): GetMethod<A, T> {
    return this.wrap(method, (records) =>
      this.logger.debug({ method: method.name, count: records.length })
    )
  }

  protected wrapFind<A extends unknown[], T>(
    method: FindMethod<A, T>
  ): FindMethod<A, T> {
    return this.wrap(method, (record) =>
      this.logger.debug({ method: method.name, count: record ? 1 : 0 })
    )
  }

  protected wrapDelete<A extends unknown[]>(
    method: DeleteMethod<A>
  ): DeleteMethod<A> {
    return this.wrap(method, (count) =>
      this.logger.debug({ method: method.name, count })
    )
  }

  private wrap<A extends unknown[], R>(
    method: AnyMethod<A, R>,
    log: (result: R) => void
  ): AnyMethod<A, R> {
    const fn = async (...args: A) => {
      const result = await method.call(this, ...args)
      log(result)
      return result
    }
    Object.defineProperty(fn, 'name', { value: method.name })
    return fn
  }
}

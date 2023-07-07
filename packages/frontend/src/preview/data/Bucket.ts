export class Bucket<T> {
  private items: T[] = []
  private picked: T[] = []

  constructor(items: readonly T[] = []) {
    this.items = [...items]
  }

  add(item: T, times = 1) {
    for (let i = 0; i < times; i++) {
      this.items.push(item)
    }
  }

  addMany(items: T[]) {
    this.items.push(...items)
  }

  pick(): T {
    if (this.items.length === 0) {
      this.items = this.picked
      this.picked = []
    }
    if (this.items.length === 0) {
      throw new Error('Empty bucket')
    }
    const index = Math.floor(Math.random() * this.items.length)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const item = this.items[index]!
    this.items.splice(index, 1)
    this.picked.push(item)
    return item
  }

  pickExcept<A extends T[]>(...exceptItems: A): Exclude<T, A[number]> {
    const item = this.pick()
    if (exceptItems.includes(item)) return this.pickExcept(...exceptItems)
    return item as Exclude<T, A[number]>
  }
}

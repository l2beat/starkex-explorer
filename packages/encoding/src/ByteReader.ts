import { DecodingError } from './DecodingError'

export class ByteReader {
  position = 0

  constructor(private data: string) {
    if (data.startsWith('0x')) {
      this.data = data.slice(2)
    }
    if (!/^[\da-f]*$/i.test(this.data)) {
      throw new TypeError('Invalid hexadecimal string')
    }
    if (this.data.length % 2 !== 0) {
      throw new TypeError('Data is not byte aligned')
    }
    this.data = this.data.toLowerCase()
  }

  peek(n: number) {
    const end = (this.position + n) * 2
    if (this.data.length < end) {
      throw new DecodingError('Went out of bounds')
    }
    return this.data.slice(this.position * 2, end)
  }

  skip(n: number) {
    this.position += n
    if (this.data.length < this.position * 2) {
      throw new DecodingError('Went out of bounds')
    }
  }

  read(n: number) {
    const result = this.peek(n)
    this.position += n
    return result
  }

  readBigInt(n: number) {
    const hex = this.read(n)
    return BigInt('0x' + hex)
  }

  readNumber(n: number) {
    const big = this.readBigInt(n)
    if (big > Number.MAX_SAFE_INTEGER) {
      throw new DecodingError('Number too large')
    }
    return Number(big)
  }

  isAtEnd() {
    return this.position * 2 === this.data.length
  }

  assertEnd() {
    if (!this.isAtEnd()) {
      throw new DecodingError('Unread data remaining')
    }
  }
}

export class ByteWriter {
  private result = ''

  write(bytes: string) {
    if (bytes.startsWith('0x')) {
      bytes = bytes.slice(2)
    }
    if (!/^[\da-f]*$/i.test(bytes)) {
      throw new TypeError('Invalid hexadecimal string')
    }
    if (bytes.length % 2 !== 0) {
      throw new TypeError('Data is not byte aligned')
    }
    this.result += bytes.toLowerCase()
    return this
  }

  writePadding(n: number) {
    this.result += '00'.repeat(n)
    return this
  }

  writeNumber(value: number | bigint, n: number) {
    if (value < 0) {
      throw new TypeError('Value cannot be negative')
    }
    const encoded = value.toString(16).padStart(n * 2, '0')
    if (encoded.length > n * 2) {
      throw new TypeError('Value too large')
    }
    this.result += encoded
    return this
  }

  getBytes() {
    return this.result
  }
}

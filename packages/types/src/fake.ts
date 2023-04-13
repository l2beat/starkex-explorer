import range from 'lodash/range'

const HEX_DIGITS = '0123456789abcdef'

export function fakeHexDigit() {
  return HEX_DIGITS[Math.floor(Math.random() * HEX_DIGITS.length)]
}

export function fakeHexString(length: number) {
  return range(length).map(fakeHexDigit).join('')
}

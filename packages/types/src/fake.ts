const HEX_DIGITS = '0123456789abcdef'

export function fakeHexDigit() {
  return HEX_DIGITS[Math.floor(Math.random() * HEX_DIGITS.length)]
}

export function fakeHexString(length: number) {
  return Array.from({ length }).map(fakeHexDigit).join('')
}

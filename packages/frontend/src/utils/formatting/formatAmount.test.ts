import { expect } from 'earl'

import {
  FormatOptions,
  formatWithDecimals,
  quantumToDecimals,
} from './formatAmount'

describe(formatWithDecimals.name, () => {
  const testCases: [bigint, number, FormatOptions, string][] = [
    [0n, 0, {}, '0'],
    [0n, 50, {}, '0'],
    [1n, 0, {}, '1'],
    [1n, 1, {}, '0.1'],
    [1n, 4, {}, '0.0001'],
    [123n, 4, {}, '0.0123'],
    [123456n, 4, {}, '12.3456'],
    [123456789n, 4, {}, '12,345.6789'],
    [12345678900n, 4, {}, '1,234,567.89'],
    [123n, 0, {}, '123'],
    [1234n, 0, {}, '1,234'],
    [12345n, 0, {}, '12,345'],
    [123456n, 0, {}, '123,456'],
    [1234567n, 0, {}, '1,234,567'],
    [123456789123456789123456789n, 18, {}, '123,456,789.123456789123456789'],
    [-1n, 0, {}, '-1'],
    [-1234n, 0, {}, '-1,234'],
    [-1n, 4, {}, '-0.0001'],
    [-12345678n, 4, {}, '-1,234.5678'],
    [123456789n, 4, { prefix: '$' }, '$12,345.6789'],
    [-123456789n, 4, { prefix: '$' }, '-$12,345.6789'],
    [123456789n, 4, { prefix: '$', signed: true }, '+$12,345.6789'],
    [123456789n, 4, { suffix: ' BTC' }, '12,345.6789 BTC'],
    [-123456789n, 4, { suffix: ' BTC' }, '-12,345.6789 BTC'],
    [-1n, 0, { signed: true }, '-1'],
    [0n, 0, { signed: true }, '0'],
    [1n, 0, { signed: true }, '+1'],
  ]

  for (const [amount, decimals, options, expected] of testCases) {
    const optionText = JSON.stringify({ ...options, decimals })
    it(`formats ${amount} ${optionText} as ${expected}`, () => {
      expect(formatWithDecimals(amount, decimals, options)).toEqual(expected)
    })
  }
})

describe(quantumToDecimals.name, () => {
  const testCases: [bigint, number | undefined][] = [
    [0n, undefined],
    [-1n, undefined],
    [12n, undefined],
    [123456n, undefined],
    [1n, 0],
    [10n, 1],
    [100n, 2],
    [1000n, 3],
    [10000n, 4],
    [1000000000n, 9],
    [1000000000000000000n, 18],
  ]

  for (const [quantum, decimals] of testCases) {
    it(`should return ${decimals ?? 'undefined'} for ${quantum}`, () => {
      expect(quantumToDecimals(quantum)).toEqual(decimals)
    })
  }
})

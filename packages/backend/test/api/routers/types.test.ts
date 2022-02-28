import { expect } from 'earljs'

import { stringToPositiveInt } from '../../../src/api/routers/types'

describe(stringToPositiveInt.name, () => {
  const parser = stringToPositiveInt('10')

  describe('parses correct input', () => {
    const inputs = [undefined, null, '1']

    inputs.forEach((input) => {
      it(`${input}`, () =>
        expect(parser.safeParse(input).success).toEqual(true))
    })
  })

  describe('parses incorrect input', () => {
    const inputs = ['foo', '123foo', '', '1.2']

    inputs.forEach((input) => {
      it(`${input}`, () =>
        expect(parser.safeParse(input).success).toEqual(false))
    })
  })
})

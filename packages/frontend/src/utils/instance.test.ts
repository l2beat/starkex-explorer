import { expect } from 'earljs'
import { getInstanceName } from './instance'

describe('instance', () => {
  describe('getInstanceName', () => {
    it('returns the dYdX instance name by default', () => {
      delete process.env.STARKEX_INSTANCE
      expect(getInstanceName()).toEqual('dYdX')
    })

    it('returns dYdX for STARKEX_INSTANCE equal to dydx-mainnet', () => {
      process.env.STARKEX_INSTANCE = 'dydx-mainnet'
      expect(getInstanceName()).toEqual('dYdX')
    })

    it('returns Myria for STARKEX_INSTANCE equal to myria-goerli', () => {
      process.env.STARKEX_INSTANCE = 'myria-goerli'
      expect(getInstanceName()).toEqual('Myria')
    })

    it('returns GammaX for STARKEX_INSTANCE equal to gammax-goerli', () => {
      process.env.STARKEX_INSTANCE = 'gammax-goerli'
      expect(getInstanceName()).toEqual('GammaX')
    })

    it('throws an error if the instance name is unknown', () => {
      process.env.STARKEX_INSTANCE = 'random-InStaNcE'
      expect(() => getInstanceName()).toThrow(
        Error,
        'Unknown STARKEX_INSTANCE: random-InStaNcE'
      )
    })
  })
})

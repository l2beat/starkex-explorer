import { expect } from 'earljs'

import { bytes4Keccak256, getAssetSelector } from './getAssetSelector'

describe(getAssetSelector.name, () => {
  it('returns the correct selector for ETH', () => {
    expect(getAssetSelector('ETH')).toEqual('0x8322fff2')
  })

  it('returns the correct selector for ERC20', () => {
    expect(getAssetSelector('ERC20')).toEqual('0xf47261b0')
  })

  it('returns the correct selector for ERC721', () => {
    expect(getAssetSelector('ERC721')).toEqual('0x02571792')
  })

  it('returns the correct selector for ERC1155', () => {
    expect(getAssetSelector('ERC1155')).toEqual('0x3348691d')
  })
})

describe(bytes4Keccak256.name, () => {
  it('returns the first 4 bytes of keccak256 hash', () => {
    expect(bytes4Keccak256('SomeRandomString')).toEqual('0x5ae6a876')
  })
})

import { expect } from 'earljs'
import { Hash256, PedersenHash, StarkKey } from '@explorer/types'
import { formatHashLong, formatHashShort } from '../../../src/pages/formatting'

describe(formatHashLong.name, () => {
  it('formats a PedersenHash', () => {
    const hash = PedersenHash(
      '02cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b982'
    )
    const formatted = formatHashLong(hash)
    expect(formatted).toEqual(
      '0x02CF24DBA5FB0A30E26E83B2AC5B9E29E1B161E5C1FA7425E73043362938B982'
    )
  })

  it('formats a StarkKey', () => {
    const hash = StarkKey(
      '0x02cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b982'
    )
    const formatted = formatHashLong(hash)
    expect(formatted).toEqual(
      '0x02CF24DBA5FB0A30E26E83B2AC5B9E29E1B161E5C1FA7425E73043362938B982'
    )
  })

  it('formats a Hash256', () => {
    const hash = Hash256(
      '0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    )
    const formatted = formatHashLong(hash)
    expect(formatted).toEqual(
      '0x2CF24DBA5FB0A30E26E83B2AC5B9E29E1B161E5C1FA7425E73043362938B9824'
    )
  })

  it('formats a string', () => {
    const hash =
      '0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'

    const formatted = formatHashLong(hash)
    expect(formatted).toEqual(
      '0x2CF24DBA5FB0A30E26E83B2AC5B9E29E1B161E5C1FA7425E73043362938B9824'
    )
  })
})

describe(formatHashShort.name, () => {
  it('formats a PedersenHash', () => {
    const hash = PedersenHash(
      '02cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b982'
    )
    const formatted = formatHashShort(hash)
    expect(formatted).toEqual('0x02CF24DB…2938B982')
  })

  it('formats a StarkKey', () => {
    const hash = StarkKey(
      '0x02cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b982'
    )
    const formatted = formatHashShort(hash)
    expect(formatted).toEqual('0x02CF24DB…2938B982')
  })

  it('formats a Hash256', () => {
    const hash = Hash256(
      '0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    )
    const formatted = formatHashShort(hash)
    expect(formatted).toEqual('0x2CF24DBA…938B9824')
  })

  it('formats a string', () => {
    const hash =
      '0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'

    const formatted = formatHashShort(hash)
    expect(formatted).toEqual('0x2CF24DBA…938B9824')
  })
})

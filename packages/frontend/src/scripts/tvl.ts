// eslint-disable-next-line no-restricted-imports
import { tvlElId } from '../view/old/home/tvlElId'
import { Api } from './peripherals/api'

export function initTVLDisplay() {
  const tvlEl = document.querySelector('#' + tvlElId)
  if (tvlEl) {
    Api.getDydxTvl()
      .then((tvl) => {
        if (tvl !== undefined) {
          tvlEl.innerHTML = '$' + formatLargeNumber(tvl)
        }
      })
      .catch(console.error)
  }
}

const units = ['', 'K', 'M', 'B', 'T']
const HAIR_SPACE = '\u200a'

function formatLargeNumber(value: number): string {
  if (value === 0) {
    return '0.00'
  } else if (value < 0) {
    return `-${formatLargeNumber(-value)}`
  }
  const str = Math.floor(value * 100).toString()
  for (const [i, unit] of units.entries()) {
    if (str.length <= 4 + i * 3) {
      const offset = str.length - 2 - i * 3
      return (
        str.slice(0, offset) +
        '.' +
        str.slice(offset, offset + 2) +
        withSpace(unit)
      )
    } else if (str.length === 5 + i * 3) {
      return str.slice(0, 3) + withSpace(unit)
    }
  }
  return str.slice(0, 1 - units.length * 3) + withSpace(units[units.length - 1])
}

function withSpace(unit?: string) {
  if (unit) {
    return HAIR_SPACE + unit
  }
  return ''
}

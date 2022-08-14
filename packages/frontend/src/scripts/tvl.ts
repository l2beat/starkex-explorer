import { tvlElId } from '../pages/home/tvlElId'

export function initTVLDisplay() {
  const tvlEl = document.querySelector('#' + tvlElId)
  if (tvlEl) {
    fetch('https://l2beat.com/api/dydx.json')
      .then((res) => res.json())
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const tvl = Number(res.data?.[res.data?.length - 1]?.[1])
        if (Number.isNaN(tvl)) {
          return
        }
        tvlEl.innerHTML = '$' + formatLargeNumber(tvl)
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

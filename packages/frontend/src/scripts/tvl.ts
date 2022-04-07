import { formatLargeNumber } from '../pages/formatLargeNumber'
import { tvlElId } from '../pages/home/tvlElId'

export function initTVLDisplay() {
  const tvlEl = document.querySelector('#' + tvlElId)
  if (tvlEl) {
    fetch('https://l2beat.com/api/dydx.json')
      .then((res) => res.json())
      .then((res) => {
        const tvl = Number(res.data?.[res.data?.length - 1]?.[1])
        if (Number.isNaN(tvl)) {
          return
        }
        tvlEl.innerHTML = '$' + formatLargeNumber(tvl)
      })
      .catch(console.error)
  }
}
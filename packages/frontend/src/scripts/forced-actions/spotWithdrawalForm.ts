import { SpotWithdrawalFormId } from '../../view/pages/forced-actions/NewSpotForcedWithdrawalPage'

export function initSpotWithdrawalForm() {
  const form = document.getElementById(SpotWithdrawalFormId)

  if (!form) {
    return
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    alert('Spot withdrawal submitted')
  })
}

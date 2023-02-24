import { SpotWithdrawalFormId } from '../../view/pages/forced-actions/SpotForcedWithdrawPage'

export function initSpotWithdrawalForm() {
  const form = document.getElementById(SpotWithdrawalFormId)

  if (!form) {
    return
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    alert('Spot withdrawal submitted')
  })
}

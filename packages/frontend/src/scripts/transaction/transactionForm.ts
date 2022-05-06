import { AssetId } from '@explorer/types'

import { getAssetImageUrl } from '../../pages/common/icons/getAssetImageUrl'
import { getFormElements } from './getFormElements'
import { jsonToProps } from './jsonToProps'

export function initTransactionForm() {
  if (!document.querySelector('#transaction-form')) {
    return
  }

  const ui = getFormElements()

  const propsJson = JSON.parse(ui.form.dataset.props ?? '{}')
  const props = jsonToProps(propsJson)

  let selectedAsset = getAsset(props.selectedAsset)

  ui.assetSelect.addEventListener('change', () =>
    setSelected(AssetId(ui.assetSelect.value))
  )

  ui.assetMaxButton.addEventListener('click', () => {
    ui.assetAmountInput.value = selectedAsset.balance.toString()
  })

  function getAsset(selected: AssetId) {
    const asset = props.assets.find((x) => x.assetId === selected)
    if (!asset) {
      throw new Error('Programmer error: Nonexistent asset selected')
    }
    return asset
  }

  function setSelected(selected: AssetId) {
    ui.assetIconView.setAttribute('src', getAssetImageUrl(selected))
    ui.assetSymbolView.innerText = AssetId.symbol(selected).toUpperCase()

    selectedAsset = getAsset(selected)

    ui.assetBalanceView.innerText = `Balance: ${selectedAsset.balance}`
    ui.assetAmountInput.value = ''

    const isUSDC = selected === AssetId.USDC
    const isPositive = selectedAsset.balance > 0n

    ui.exitButton.classList.toggle('bg-grey-300', isUSDC)
    ui.buyButton.classList.toggle('bg-grey-300', !isUSDC && !isPositive)
    ui.sellButton.classList.toggle('bg-grey-300', !isUSDC && isPositive)
  }
}

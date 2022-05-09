import { AssetId } from '@explorer/types'

import { PositionAssetEntry } from '../../pages'
import { getAssetImageUrl } from '../../pages/common/icons/getAssetImageUrl'
import { getFormElements } from './getFormElements'
import { jsonToProps } from './jsonToProps'

export function initTransactionForm() {
  if (!document.querySelector('#transaction-form')) {
    return
  }

  const ui = getFormElements()
  ui.form.classList.remove('hidden')
  ui.form.classList.add('flex')

  const propsJson = JSON.parse(ui.form.dataset.props ?? '{}')
  const props = jsonToProps(propsJson)
  const search = new URLSearchParams(location.search)
  const fromUrl = search.get('assetId')

  let selectedAsset = getAsset(fromUrl ? AssetId(fromUrl) : props.selectedAsset)
  updateUI(selectedAsset)

  ui.assetSelect.addEventListener('change', () =>
    setSelected(AssetId(ui.assetSelect.value))
  )

  ui.assetMaxButton.addEventListener('click', () => {
    ui.assetAmountInput.value = selectedAsset.balance.toString()
  })

  ui.exitButton.addEventListener('click', () => setSelected(AssetId.USDC))

  ui.buyButton.addEventListener('click', () => {
    const buyable = props.assets.find(isBuyable)
    if (!buyable) {
      throw new Error('Programmer error: Buy button should be invisible')
    }
    setSelected(buyable.assetId)
  })

  ui.sellButton.addEventListener('click', () => {
    const sellable = props.assets.find(isSellable)
    if (!sellable) {
      throw new Error('Programmer error: Sell button should be invisible')
    }
    setSelected(sellable.assetId)
  })

  function getAsset(selected: AssetId) {
    const asset = props.assets.find((x) => x.assetId === selected)
    if (!asset) {
      console.error('Programmer error: Nonexistent asset selected')
      return props.assets[0]
    }
    return asset
  }

  function setSelected(selected: AssetId) {
    selectedAsset = getAsset(selected)
    updateUI(selectedAsset)
  }

  function updateUI(asset: PositionAssetEntry) {
    ui.assetIconView.setAttribute('src', getAssetImageUrl(asset.assetId))
    ui.assetSymbolView.innerText = AssetId.symbol(asset.assetId).toUpperCase()

    ui.assetBalanceView.innerText = `Balance: ${asset.balance}`
    ui.assetAmountInput.value = ''

    const isUSDC = asset.assetId === AssetId.USDC
    const isPositive = asset.balance > 0n
    const hasUSDC = props.assets.some((x) => x.assetId === AssetId.USDC)
    const hasBuy = props.assets.some(isBuyable)
    const hasSell = props.assets.some(isSellable)

    ui.exitButton.classList.toggle('bg-grey-300', isUSDC)
    ui.exitButton.classList.toggle('hidden', !hasUSDC)
    ui.buyButton.classList.toggle('bg-grey-300', !isUSDC && !isPositive)
    ui.buyButton.classList.toggle('hidden', !hasBuy)
    ui.sellButton.classList.toggle('bg-grey-300', !isUSDC && isPositive)
    ui.sellButton.classList.toggle('hidden', !hasSell)
    ui.priceSection.classList.toggle('hidden', isUSDC)
    ui.totalSection.classList.toggle('hidden', isUSDC)
    ui.infoSection.classList.toggle('hidden', !isUSDC)

    search.set('assetId', asset.assetId.toString())
    history.replaceState(
      null,
      '',
      `${location.origin}${location.pathname}?${search}`
    )
  }
}

function isSellable(x: PositionAssetEntry): boolean {
  return x.assetId !== AssetId.USDC && x.balance > 0n
}

function isBuyable(x: PositionAssetEntry): boolean {
  return x.assetId !== AssetId.USDC && x.balance < 0n
}

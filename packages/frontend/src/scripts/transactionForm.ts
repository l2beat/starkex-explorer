import { AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { PositionAssetEntry } from '../pages'
import { getAssetImageUrl } from '../pages/common/icons/getAssetImageUrl'
import { TransactionFormProps } from '../pages/transaction-form'

export function initTransactionForm() {
  const form = document.querySelector<HTMLFormElement>('#transaction-form')
  if (!form) {
    return
  }

  function getElement<T extends Element>(form: HTMLFormElement, query: string) {
    const element = form.querySelector<T>(query)
    if (!element) {
      throw new Error(`Cannot find ${query}`)
    }
    return element
  }

  const assetSelect = getElement<HTMLSelectElement>(form, '#asset-select')
  const assetAmountInput = getElement<HTMLSelectElement>(form, '#asset-amount')
  const assetMaxButton = getElement<HTMLSelectElement>(form, '#asset-max')
  const assetBalanceView = getElement<HTMLSelectElement>(form, '#asset-balance')
  const assetIconView = getElement<HTMLImageElement>(form, '#asset-icon')
  const assetSymbolView = getElement<HTMLImageElement>(form, '#asset-symbol')

  const propsJson = JSON.parse(form.dataset.props ?? '{}')
  const props = jsonToProps(propsJson)

  let selectedAsset = getAsset(props.selectedAsset)

  assetSelect.addEventListener('change', () =>
    setSelected(AssetId(assetSelect.value))
  )

  assetMaxButton.addEventListener('click', () => {
    assetAmountInput.value = selectedAsset.balance.toString()
  })

  function getAsset(selected: AssetId) {
    const asset = props.assets.find((x) => x.assetId === selected)
    if (!asset) {
      throw new Error('Programmer error: Nonexistent asset selected')
    }
    return asset
  }

  function setSelected(selected: AssetId) {
    assetIconView.setAttribute('src', getAssetImageUrl(selected))
    assetSymbolView.innerText = AssetId.symbol(selected).toUpperCase()

    selectedAsset = getAsset(selected)

    assetBalanceView.innerText = `Balance: ${selectedAsset.balance}`
    assetAmountInput.value = ''
  }
}

function jsonToProps(propsJson: unknown): TransactionFormProps {
  function assert(premise: boolean): asserts premise {
    if (!premise) {
      throw new Error('Cannot read props')
    }
  }

  assert(typeof propsJson === 'object' && propsJson !== null)
  const record = propsJson as Record<string, unknown>
  assert(typeof record.account === 'string')
  assert(typeof record.positionId === 'string')
  assert(typeof record.publicKey === 'string')
  assert(typeof record.selectedAsset === 'string')
  assert(Array.isArray(record.assets))

  function jsonToAsset(assetJson: unknown): PositionAssetEntry {
    assert(typeof assetJson === 'object' && assetJson !== null)
    const record = assetJson as Record<string, unknown>
    assert(typeof record.assetId === 'string')
    assert(typeof record.balance === 'string')
    assert(typeof record.priceUSDCents === 'string')
    assert(typeof record.totalUSDCents === 'string')
    return {
      assetId: AssetId(record.assetId),
      balance: BigInt(record.balance),
      priceUSDCents: BigInt(record.priceUSDCents),
      totalUSDCents: BigInt(record.totalUSDCents),
    }
  }

  return {
    account: EthereumAddress(record.account),
    positionId: BigInt(record.positionId),
    publicKey: StarkKey(record.publicKey),
    selectedAsset: AssetId(record.selectedAsset),
    assets: record.assets.map(jsonToAsset),
  }
}

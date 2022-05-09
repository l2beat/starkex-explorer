import { AssetId } from '@explorer/types'

import { PositionAssetEntry } from '../../pages'
import { TransactionFormProps } from '../../pages/transaction-form'
import { FormAction, FormState } from './types'

export function getInitialState(
  props: TransactionFormProps,
  queryString: string
): FormState {
  const search = new URLSearchParams(queryString)
  const fromUrl = search.get('assetId')
  const initialAssetId = fromUrl ? AssetId(fromUrl) : props.selectedAsset

  const hasUSDC = props.assets.some((x) => x.assetId === AssetId.USDC)
  const hasBuy = props.assets.some(isBuyable)
  const hasSell = props.assets.some(isSellable)

  const candidate: FormState = {
    props,
    selectedAsset: props.assets[0],
    amountInputString: '',
    amountInputValue: 0n,
    priceInputString: '',
    priceInputValue: 0n,
    totalInputString: '',
    totalInputValue: 0n,

    exitButtonVisible: hasUSDC,
    buyButtonVisible: hasBuy,
    sellButtonVisible: hasSell,

    // To be determined by nextFormState
    exitButtonSelected: false,
    buyButtonSelected: false,
    sellButtonSelected: false,
    priceSectionVisible: false,
    totalSectionVisible: false,
    infoSectionVisible: false,
  }
  return nextFormState(candidate, {
    type: 'AssetChange',
    assetId: initialAssetId,
  })
}

export function nextFormState(state: FormState, action: FormAction): FormState {
  if (action.type === 'AssetChange') {
    const selectedAsset = getAsset(action.assetId, state.props.assets)

    const isUSDC = selectedAsset.assetId === AssetId.USDC
    const isPositive = selectedAsset.balance > 0n

    return {
      ...state,
      selectedAsset,
      amountInputString: '',
      amountInputValue: 0n,
      priceInputString: '',
      priceInputValue: 0n,
      totalInputString: '',
      totalInputValue: 0n,
      exitButtonSelected: isUSDC,
      buyButtonSelected: !isUSDC && !isPositive,
      sellButtonSelected: !isUSDC && isPositive,
      priceSectionVisible: !isUSDC,
      totalSectionVisible: !isUSDC,
      infoSectionVisible: isUSDC,
    }
  } else if (action.type === 'SwitchToBuy') {
    const buyable = state.props.assets.find(isBuyable)
    if (!buyable) {
      throw new Error('Programmer error: Buy button should be invisible')
    }
    return nextFormState(state, {
      type: 'AssetChange',
      assetId: buyable.assetId,
    })
  } else if (action.type === 'SwitchToSell') {
    const sellable = state.props.assets.find(isSellable)
    if (!sellable) {
      throw new Error('Programmer error: Sell button should be invisible')
    }
    return nextFormState(state, {
      type: 'AssetChange',
      assetId: sellable.assetId,
    })
  } else if (action.type === 'UseMaxBalance') {
    return {
      ...state,
      amountInputString: formatCurrencyInput(
        state.selectedAsset.balance,
        state.selectedAsset.assetId
      ),
      amountInputValue: state.selectedAsset.balance,
    }
  } else if (action.type === 'ModifyAmount') {
    const parsed = parseCurrencyInput(action.value, state.selectedAsset.assetId)
    return {
      ...state,
      amountInputString:
        parsed !== undefined ? action.value : state.amountInputString,
      amountInputValue: parsed ?? state.amountInputValue,
    }
  }
  return state
}

function getAsset(selected: AssetId, assets: readonly PositionAssetEntry[]) {
  let asset = assets.find((x) => x.assetId === selected)
  if (!asset) {
    console.error('Nonexistent asset selected')
    asset = assets[0]
    if (!asset) {
      throw new Error('Programmer error: No assets')
    }
  }
  return asset
}

function isSellable(x: PositionAssetEntry): boolean {
  return x.assetId !== AssetId.USDC && x.balance > 0n
}

function isBuyable(x: PositionAssetEntry): boolean {
  return x.assetId !== AssetId.USDC && x.balance < 0n
}

export function formatCurrencyInput(value: bigint, assetId: AssetId): string {
  if (value < 0) {
    return formatCurrencyInput(-value, assetId)
  }
  const decimals = AssetId.decimals(assetId)
  const base = value.toString().padStart(decimals + 1, '0')
  const integerPart = base.slice(0, base.length - decimals)
  let fractionPart = decimals !== 0 ? '.' + base.slice(-decimals) : ''
  while (fractionPart.endsWith('0')) {
    fractionPart = fractionPart.slice(0, -1)
  }
  return integerPart + fractionPart
}

function parseCurrencyInput(
  value: string,
  assetId: AssetId
): bigint | undefined {
  if (value === '') {
    return 0n
  }
  const INPUT_RE = /^\d+\.?\d*$/
  if (INPUT_RE.test(value)) {
    const decimals = AssetId.decimals(assetId)
    const [integer, fraction] = value.split('.')
    if (!fraction || fraction.length <= decimals) {
      return (
        BigInt(integer) * 10n ** BigInt(decimals) +
        BigInt((fraction ?? '').padEnd(decimals, '0'))
      )
    }
  }
  return undefined
}

export interface ERCType extends String {
  _ERCTypeBrand: string
}

export function ERCType(value: string) {
  const allowedValues = [
    'ETH',
    'ERC-20',
    'ERC-721',
    'ERC-1155',
    'MINTABLE_ERC-721',
    'MINTABLE_ERC-20',
  ]
  if (!allowedValues.includes(value)) {
    throw new Error('Invalid ERCType')
  }
  return value as unknown as ERCType
}

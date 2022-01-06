import { decodeFirstPage } from './decodeFirstPage'
import { decodeUpdates } from './decodeUpdates'
import { OnChainData } from './OnChainData'

export function decodeOnChainData(pages: string[]): OnChainData {
  const [first, ...rest] = pages
  const firstPage = decodeFirstPage(first)
  const updates = decodeUpdates(rest.join(''))
  return { ...firstPage, ...updates }
}

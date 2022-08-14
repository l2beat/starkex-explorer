import { OnChainData } from '../OnChainData'
import { decodeFirstPage } from './decodeFirstPage'
import { decodeUpdates } from './decodeUpdates'
import { DecodingError } from './DecodingError'

export function decodeOnChainData(pages: string[]): OnChainData {
  const [first, ...rest] = pages
  if (!first) {
    throw new DecodingError('Missing first page of data')
  }
  const firstPage = decodeFirstPage(first)
  const updates = decodeUpdates(rest.join(''))
  return { ...firstPage, ...updates }
}

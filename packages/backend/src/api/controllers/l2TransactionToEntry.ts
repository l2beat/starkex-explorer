import { L2TransactionRecord } from '../../peripherals/database/L2TransactionRepository'

export function l2TransactionToEntry(l2Transaction: L2TransactionRecord) {
  return {
    ...l2Transaction,
    isPartOfMulti: !!l2Transaction.parentId,
  }
}

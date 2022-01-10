import {
  Filter,
  FilterByBlockHash,
  Log,
} from '../../peripherals/ethereum/types'

export type GetLogs = (filter: Filter | FilterByBlockHash) => Promise<Log[]>

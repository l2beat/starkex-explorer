import React from "react";

import { NewTable } from "../common/table";
import { Status } from "./Status";
import { EthereumTransactionEntry } from "./UserProps";

export interface EthereumTransactionsTableProps {
    readonly ethereumTransactions: readonly EthereumTransactionEntry[];
}

export function EthereumTransactionsTable({ethereumTransactions}: EthereumTransactionsTableProps) {
    return(<NewTable pageSize={6} id='test' title="Ethereum transactions" noRowsText="You have no ethereum transactions" columns={[{header: 'TIME'}, {header: 'HASH'}, {header: 'ASSET'}, {header: 'AMOUNT'}, {header: "STATUS"}, {header: 'TYPE'}]} 
        rows={ethereumTransactions.map((transaction) => {
            const link = `/ethereumTransactions/${transaction.hash}` //TODO: Construct a proper link
            const date = new Date(transaction.timestamp.valueOf())
            return {
                link,
                cells: [
                    `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
                    <a href={`etherscan link`} className='text-blue-300 underline'>{transaction.hash.substring(0, 7)}...</a>,
                    transaction.asset,
                    transaction.amount.toString(),
                    <Status status={transaction.status} />,
                    transaction.type
                ]
            }
        })}
    />)
}

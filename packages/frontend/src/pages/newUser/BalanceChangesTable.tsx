import cx from 'classnames';
import React from "react";

import { NewTable } from "../common/table";
import { BalanceChangeEntry } from "./UserProps";

export interface BalanceChangesTableProps {
    readonly balanceChanges: readonly BalanceChangeEntry[];
}

export function BalanceChangesTable({balanceChanges}: BalanceChangesTableProps) {
    return(<NewTable pageSize={6} id='test' title="Balance changes" noRowsText="You have no balanceChanges" columns={[{header: 'TIME'}, {header: 'STATE UPDATE ID'}, {header: 'ASSET'}, {header: 'BALANCE AFTER'}, {header: "CHANGE"}, {header: 'VAULT ID'}]} 
        rows={balanceChanges.map((balanceChange) => {
            const link = `/balanceChanges/${balanceChange.asset}` //TODO: Construct a proper link
            const date = new Date(balanceChange.timestamp.valueOf())
            const positiveChange = balanceChange.change > 0
            return {
                link,
                cells: [
                    `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
                    balanceChange.stateUpdateId,
                    balanceChange.asset,
                    balanceChange.newBalance.toString(),
                    <p className={cx("", {"text-red-100": !positiveChange}, {"text-green-100": positiveChange})}>{`${positiveChange ? '+': '-'} ${balanceChange.change.toString()} ${balanceChange.asset}`}</p>,
                    <p className='text-grey-500'>#{balanceChange.vaultId}</p>
                ]
            }
        })}
    />)
}

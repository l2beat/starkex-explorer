import React from "react";

import { StatusBadge } from "../../components/StatusBadge";
import { toStatusType } from "../user/components/UserTransactionsTable";

interface TransactionOverviewProps {
    currentStatus: 'SENT (1/2)' | 'MINED (2/2)' | 'REVERTED' // TODO: Add all possible statuses
    transactionHash: string
    stateUpdateId: number
    children: React.ReactNode
}

export function TransactionOverview(props: TransactionOverviewProps) {
    return(
        <div className="flex flex-col gap-6">
            <p className="font-semibold text-xxl text-white">Transaction <span className="text-blue-600 underline">#{props.transactionHash.substring(0, 7)}...</span></p>
            <div className="flex flex-col rounded-lg bg-gray-800 p-6 gap-6 items-center">
                <div className="flex flex-col gap-2">
                    <p className="text-zinc-500 font-semibold text-sm">Current status</p>
                    <div className="flex items-center justify-start gap-2">
                        <StatusBadge type={toStatusType(props.currentStatus)} children={props.currentStatus} />
                        <p className="text-white text-lg font-semibold">Transaction included in state update <span className="underline text-blue-600">#{props.stateUpdateId}</span></p>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <p className="text-zinc-500 font-semibold text-sm">Transaction hash</p>
                    <p className="text-blue-600 underline text-lg">{props.transactionHash}</p>
                </div>
                {props.children}
            </div>
        </div>
    );
}

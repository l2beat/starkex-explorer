import { EthereumAddress, StarkKey } from "@explorer/types";
import React from "react";

interface RecipientDetailsProps {
    id: string
    idLabel: 'Position ID' | 'Vault ID'
    ethereumAddress?: EthereumAddress
    starkKey?: StarkKey
}

// Can also be used to represent taker details and maker details so we probably should rename it accordingly
export function RecipientDetails(props: RecipientDetailsProps) {
  return (
    <div className="p-6 rounded-lg bg-gray-800 flex items-center justify-between font-semibold">
        <div className="flex flex-col gap-2">
            <p className="text-sm text-zinc-500">{props.idLabel}</p>
            <p className="text-lg text-white">{props.id}</p>
        </div>
        {props.starkKey && <div className="flex flex-col gap-2">
            <p className="text-sm text-zinc-500">Stark Key</p>
            <p className="text-lg text-blue-600 underline">{props.starkKey.toString()}</p>
        </div>}
        {props.ethereumAddress && <div className="flex flex-col gap-2">
            <p className="text-sm text-zinc-500">Ethereum Address</p>
            <p className="text-lg text-blue-600 underline">{props.ethereumAddress.toString()}</p>
        </div>}
    </div>
  );
}

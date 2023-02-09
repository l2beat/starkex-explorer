import React from "react";

import { ActionButton } from "../common/ActionButton";
import { NewTable } from "../common/table";
import { AssetEntry } from "./UserProps";

export interface AssetsTableProps {
    readonly assets: readonly AssetEntry[];
}

export function AssetsTable({assets}: AssetsTableProps) {
    return(<NewTable noRowsText="You have no assets" columns={[{header: '', className: '!w-9'}, {header: 'NAME'}, {header: 'BALANCE/ID'}, {header: 'VAULT'}, {header: "ACTION", numeric: true}]} 
        rows={assets.map((asset) => {
            const link = `/assets/${asset.name}` //TODO: Construct a proper link
            return {
                link,
                cells: [
                    asset.icon,
                    asset.name,
                    asset.balance.toString(),
                    asset.vaultId,
                    <ActionButton>{asset.action}</ActionButton>
                ]
            }
        })}
    />)
}

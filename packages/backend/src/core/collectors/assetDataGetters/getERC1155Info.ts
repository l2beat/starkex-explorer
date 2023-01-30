import { EthereumAddress } from "@explorer/types";
import { ethers } from "ethers";

import { provider } from "./provider";

export const getERC1155Info = (address: EthereumAddress) => {
    const abi = [
        "function name() external view returns (string _name)",
        "function symbol() external view returns (string _symbol)"
    ]

    const contract = new ethers.Contract(address.toString(), abi, provider)

    // Only the uri available here but it needs the tokenId which we don't have a this point. Can we call uri without? What do we want to do?

    return {
        name: 'Unknown NFT token', symbol: '?', decimals: 0
    }
}
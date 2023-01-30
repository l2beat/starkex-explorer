import { ethers } from "ethers";

import { getEnv } from "../../../config/getEnv";

export const provider = new ethers.providers.JsonRpcProvider(getEnv('JSON_RPC_URL'));
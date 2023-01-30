import { ethers } from "ethers";

// TODO: Figure out a way to pass the address from the config or replace it with a better provider approach
export const provider = new ethers.providers.JsonRpcProvider("https://eth-goerli.g.alchemy.com/v2/quRHg-_JObQhAZDhuX1C22LvsByvxJtJ");

#!/bin/bash
# ------------------------------------------------------------------
# Starts a local hardhat node that forks mainnet from the specified block number
# ------------------------------------------------------------------

# Make sure that the JSON_RPC_URL environment variable is set
if [ -z "$JSON_RPC_URL" ]
  then
    echo ""
    echo "Please set the JSON_RPC_URL environment variable"
    echo ""
    exit 1
fi

# Make sure that at least one parameter (fork block number) is passed in
if [ $# -eq 0 ]
  then
    echo ""
    echo "Please provide a parameter for the fork block number"
    echo ""
    exit 1
fi

npx hardhat node --fork $JSON_RPC_URL --fork-block-number $1
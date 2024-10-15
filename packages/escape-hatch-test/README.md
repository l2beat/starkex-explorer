# Escape Hatch Test

## Scripts

- `yarn test` - run automated tests
- `yarn startfork BLOCK_NUMBER` - start a local Ethereum node with a forked mainnet at a specific block
- `yarn console` - connect to a local forked network, can be used to run arbitary commands on the node (see `packages/escape-hatch-test/src/utils.ts` for all available commands)

## Setup

```bash
yarn install
yarn build
```

## Where to find exchange addresses?
Check out all config files in `packages/backend/src/config/starkex` directory for all needed addresses.

## Environment variables
    
```bash
PERPETUAL_ADDRESS=
ESCAPE_VERIFIER_ADDRESS=
JSON_RPC_URL=
```
`ESCAPE_VERIFIER_ADDRESS` is only needed for automated testing.

## Automated test

Simply run `yarn test-escape` to run the test.

## Manual testing with local explorer

> [!IMPORTANT]
> To test it manually you need to have some funds to escape with on the chosen exchange.


1. Check latest block number synced with explorer:
```sql
select max(number) from blocks;
```

2. Start hardhat node with a forked mainnet at the block number from the previous step:
```bash
yarn startfork BLOCK_NUMBER
```

3. Connect to the hardhat node console:
```bash
yarn console
```

4. Go to Metamask, switch to the forked network:
```
Network name: Hardhat Fork
RPC URL: http://localhost:8545
Chain ID: 1
Currency symbol: ETH
```

5. Open terminal with hardhat console and give yourself some ETH to test everything:
```bash
await utils.impersonateAccount(ETHEREUM_ADDRESS)
await utils.setBalanceOf(ETHEREUM_ADDRESS, ETH_AMOUNT)
```

6. Run local explorer:
- Go to `packages/backend`
- Run `yarn start:fork`
- Open `http://localhost:3000` in your browser

7. Right now the explorer should be connected to the forked network. So let's freeze the exchange.

    7.1. Using the UI
    - Go to the user page and submit a forced withdrawal
    - Go to the console and run
        ```bash
        await utils.mineGracePeriod()
        ```
    - It mines 14 days into the future - after this period of not including the withdrawal in the state the exchange can be frozen.
    - After refresh you should see that the exchange is freezable.
    - Freeze the exchange by clicking the "Freeze" button.
    - After refresh you should see that the exchange is frozen.

    7.2. Using the console
    - Run
        ```bash
        await utils.triggerFreezable()
        ```
    - After you refresh the page you should see that the exchange is freezable. You can freeze by:
        ```bash
        await utils.freeze()
        ```
    - After you refresh the page you should see that the exchange is frozen.

8. Go to your user page and start escaping. 



>[!CAUTION]
> Make sure to reset the explorer to a specific block number when you are done with testing.
```sql
BEGIN;
    delete from blocks where number > ${blockNumber};
    delete from withdrawable_assets where block_number > ${blockNumber};
    delete from user_transactions where block_number > ${blockNumber};
    delete from transaction_status where block_number > ${blockNumber};
    delete from state_updates where block_number > ${blockNumber};
    delete from state_transitions where block_number > ${blockNumber};
    delete from preprocessed_user_statistics where block_number > ${blockNumber};
    delete from preprocessed_state_details where block_number > ${blockNumber};
    delete from sent_transactions where sent_transactions.mined_block_number > ${blockNumber} OR sent_transactions.mined_block_number IS NULL;
    update key_values SET value = ${blockNumber} where key = 'lastBlockNumberSynced';
    update key_values SET value = 'not-frozen' where key = 'freezeStatus';
COMMIT;
```
# @explorer/testnet

## Scripts

- `yarn build` - build the smart contracts
- `yarn dev` - start the application using _eslint-register_
- `yarn format` - check if formatting is correct with prettier
- `yarn format:fix` - run prettier automatic formatter
- `yarn lint` - check if the code satisfies the eslint configuration
- `yarn lint:fix` - run eslint automatic fixer
- `yarn typecheck` - check if the code satisfies the typescript compiler

## Setup

To run or develop the testnet you need to install and build its dependencies. You can do it by running the following commands in the repository root:

```
yarn
yarn build
```

Assumming that you already have setted up backend before, you should create a separate database for using testnet.

```
docker exec -it state_explorer_postgres psql -U postgres -c 'CREATE DATABASE testnet'
```

Once you have everything, modify a `.env` file of backend package with the following contents:

```diff
-LOCAL_DB_URL=postgresql://postgres:password@localhost:5432/local
+LOCAL_DB_URL=postgresql://postgres:password@localhost:5432/testnet
```

After everything is setted up, you should add testnet network to metamask. To do so, log in to your metamask, click current connected network and click "Add network", then scroll down and select "Add network manually". Paste these values:

```
New RPC URL: http://127.0.0.1:8545
Chain ID: 1337
Currency symbol: ETH
```

Next, you should import one of the accounts to your metamask. You can find the private keys in the src/constants.ts file. Just choose one and add it to your metamask.

**BE AWARE OF THE FACT THAT THIS ACCOUNT CAN BE USED BY ANYONE SO KEEP IN MIND TO NOT TRANSFER ANY MONEY TO IT**

You are now good to go. Launch the testnet and backend packages, switch your metamask network to the one you have added and open page served by the backend.

# dYdX State Explorer

This tool will show decoded calldata stored on Ethereum L1 by the dYdX rollup. It will also allow users to perform force exits and trades by sending an L1 transaction.

## License

The codebase is licensed under the MIT License. The L2BEAT logo, the dYdX mark, the StarkWare mark and the StarkEx mark are not licensed under the MIT license.

dYdX and StarkWare have granted a revocable, non-exclusive, non-transferable, non-sublicensable, royalty-free and worldwide license to use the dYdX mark, the StarkWare mark and the StarkEx mark for the limited purpose of reflecting that the State Explorer pertains to the dYdX perpetuals protocol on StarkEx.

## Contributing

Make sure that you have the required dependencies installed:

- [node.js](https://nodejs.org/en/) - version 14
- [Yarn](https://classic.yarnpkg.com/en/docs/install) - version 1.22.0 or later

This repository is a monorepo consisting of four projects:

- `packages/backend` - [README.md](./packages/backend/README.md)
- `packages/frontend`
- `packages/crypto`
- `packages/encoding`

## Setup

To run or develop, you need to install and build the dependencies. You can do it by running the following commands in the repository root:

```
yarn
yarn build
```

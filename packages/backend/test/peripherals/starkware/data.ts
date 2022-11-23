export const EXAMPLE_PERPETUAL_BATCH = {
  update: {
    orders: {
      '33763544854418327': { fulfilled_amount: '10000000' },
      '1943978849277734786': { fulfilled_amount: '10000000' },
      '12319009954495611491': { fulfilled_amount: '9000000' },
      '13566982546719579735': { fulfilled_amount: '10000000' },
    },
    position_root:
      '00d766904591c4a3b7353f977e3b0be5c13dd1f1b028d6769828e4aa5861fd67',
    order_root:
      '069a24e13bc5c49bfdff40f6f2e3277cb32503ed1e5a596959b88260faf61ee5',
    positions: {
      '571': {
        assets: {},
        public_key:
          '0x31d3850b4a9181df48285a73fff1c2a9cccd46b61880a84f78c6be7a6a33a7e',
        collateral_balance: '9180000100890383028',
      },
      '574': {
        assets: {
          '0x4254432d3130000000000000000000': {
            cached_funding_index: '0',
            balance: '1000000',
          },
        },
        public_key:
          '0xd2e4d8accd3f11347b01986cfc1be8fc968a778d7e34a17c21502866b8142d',
        collateral_balance: '5001991118880',
      },
      '614': {
        assets: {
          '0x4254432d3130000000000000000000': {
            cached_funding_index: '0',
            balance: '-1000000',
          },
        },
        public_key:
          '0x53adb1457fbaf4698fe4dea32d59b895c65586f5550e0fc3398265976f70cdc',
        collateral_balance: '5099993080820',
      },
    },
    prev_batch_id: 1205,
  },
}

export const EXAMPLE_SPOT_BATCH = {
  update: {
    vaults: {
      '272051': {
        balance: '1',
        stark_key:
          '0x61b721a3f7b04524dc8919840b83094e080ad41de44caee78ccc36b61b07fea',
        token:
          '0x400d54c002305c535c5cc0cfb43b675ecb0776391be0b5a6231523df643f361',
      },
      '272052': {
        balance: '1',
        stark_key:
          '0x61b721a3f7b04524dc8919840b83094e080ad41de44caee78ccc36b61b07fea',
        token:
          '0x400771e0ad43c760b0b49d9f9ce5b85e9f8a7745079ced44af6bdb6edc69936',
      },
      '272053': {
        balance: '1',
        stark_key:
          '0x61b721a3f7b04524dc8919840b83094e080ad41de44caee78ccc36b61b07fea',
        token:
          '0x4004ccd8ff8dbf262ea16708f8fe51b7169a605b15086b437aacbb07462fb7e',
      },
    },
    orders: {
      '5528795308638913688983516265329825249594975031333247410549920057936650915':
        { fulfilled_amount: '1' },
      '22603428961528533473192364795137722761861704087037625825006983052623508499':
        { fulfilled_amount: '1' },
      '25009210736250622976039693600200497838256637516449072470104608642836003849':
        { fulfilled_amount: '1' },
      '29166437620670220529360060623748355602425744826458493727527634221864173127':
        { fulfilled_amount: '1' },
    },
    prev_batch_id: 2129,
    order_root:
      '039b5a639f426e2a2364eaca3b03796d52da9eec76cbb80332caf38ac7d49625',
    vault_root:
      '01b1059a3c2810e257ae9e0fee6f798ebaec6727923bae072e4160746f37e95e',
  },
}

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

const EXAMPLE_TRADE_TRANSACTION = {
  actual_b_fee: '7818',
  actual_a_fee: '3127',
  actual_synthetic: '1000000',
  actual_collateral: '15637500',
  party_b_order: {
    nonce: '4166992493',
    is_buying_synthetic: false,
    expiration_timestamp: '462240',
    signature: {
      s: '0x420d13e5dd48af5abefcdc25718adc5048bc11cfa2b85e2788ed20eba94abc1',
      r: '0x5a11d98a2b9c12f693dbbb28fba586d2f692b0e483ba9a57e88df1ae7c70d38',
    },
    asset_id_synthetic: '0x4554482d3900000000000000000000',
    order_type: 'LIMIT_ORDER_WITH_FEES',
    asset_id_collateral:
      '0xa21edc9d9997b1b1956f542fe95922518a9e28ace11b7b2972a1974bf5971f',
    position_id: '349432096659341736',
    amount_synthetic: '1000000',
    amount_fee: '7900',
    public_key:
      '0x61498afefa6b8b1cd5350bb973afca2ae42f844a5cf6bea556bf6b42adeea8',
    amount_collateral: '15637500',
  },
  party_a_order: {
    nonce: '3214561055',
    is_buying_synthetic: true,
    expiration_timestamp: '462240',
    signature: {
      s: '0x4954df8fe4f222fc7d7f69672d164a6e193c3a399d0fcb4b70ca4ed33947dcf',
      r: '0x56019e522bb8441ff53298f4fb8d22ddffcaa99cf70b71ca35d721fc3bca33',
    },
    asset_id_synthetic: '0x4554482d3900000000000000000000',
    order_type: 'LIMIT_ORDER_WITH_FEES',
    asset_id_collateral:
      '0xa21edc9d9997b1b1956f542fe95922518a9e28ace11b7b2972a1974bf5971f',
    position_id: '349433632881901917',
    amount_synthetic: '1000000',
    amount_fee: '7900',
    public_key:
      '0x7f37955a01978a7be26140ee28fe382964dd36b0bc092bfde64657c4a911a5d',
    amount_collateral: '15637500',
  },
  type: 'TRADE',
}

const EXAMPLE_ORACLE_PRICES_TICK_TRANSACTION = {
  timestamp: '1662510000',
  oracle_prices: {
    '0x4c494e4b2d37000000000000000000': {
      signed_prices: {
        '0x2af704df5467285c5d1bd7c08ee33c49057fb2a05ecdc4f949293190f28ce7e': {
          external_asset_id: '0x4c494e4b5553440000000000000000004465787472',
          timestamped_signature: {
            timestamp: '1662509998',
            signature: {
              s: '0x2935ac813d30f7fbec2837d26c04ea6ceae3cd97f3bb4e21aa6b7d0910627fe',
              r: '0x80b43cc57e0d8d8a15f5f44af5bec90ed63153f0b33cee926af3db2ce49e1e',
            },
          },
          price: '6617000000000000000',
        },
        '0xcc85afe4ca87f9628370c432c447e569a01dc96d160015c8039959db8521c4': {
          external_asset_id: '0x4c494e4b55534400000000000000000053746f726b',
          timestamped_signature: {
            timestamp: '1662510000',
            signature: {
              s: '0x10ae1669e7f0b94829fe5936f793b883dd7e159f11de2953e3d0c24172d2c59',
              r: '0x49ea9e000c2c2de6ba11f0d2482523c6d06d2a8686878655b1ddfa1729c3df3',
            },
          },
          price: '6614000000000000000',
        },
      },
      price: '2841335615',
    },
  },
  type: 'ORACLE_PRICES_TICK',
}
const EXAMPLE_FUNDING_TICK_TRANSACTION = {
  global_funding_indices: {
    indices: {
      '0x4254432d3130000000000000000000': '-611628632',
      '0x444f47452d35000000000000000000': '-317421406',
      '0x4554482d3900000000000000000000': '-2642902836',
      '0x4c494e4b2d37000000000000000000': '-608369332',
    },
    timestamp: '1662512400',
  },
  type: 'FUNDING_TICK',
}

const EXAMPLE_LIQUIDATE_TRANSACTION = {
  actual_collateral: '7758176404715800194',
  actual_liquidator_fee: '8791662011684601223',
  actual_synthetic: '15308084094301570617',
  liquidated_position_id: '15419682365516802845',
  liquidator_order: {
    amount_collateral: '8187132600743567510',
    amount_fee: '11081939229867047606',
    amount_synthetic: '16558026091473266411',
    asset_id_collateral:
      '0x57d05d11b570fd197b55746070ee051c731ee109b07255eab3c9cf8b6c579d',
    asset_id_synthetic: '0x4254432d3130000000000000000000',
    expiration_timestamp: '1430804514',
    is_buying_synthetic: false,
    nonce: '3900315155',
    order_type: 'LIMIT_ORDER_WITH_FEES',
    position_id: '11534118754833929857',
    public_key:
      '0x5db665983e23607de57d6dc068797336bfdcb954238044688bec922ca296d3e',
    signature: {
      r: '0x4ac8a77f5863238a8bfb8a2e7f2dcc70cb8cad7b45692497b4b2c3ff06f6c94',
      s: '0x6fd86c349a6c6266d34c11da0ff8c0cf211cafbadc39ba4a4c38124344f3bb1',
    },
  },
  type: 'LIQUIDATE',
}

const EXAMPLE_TRANSFER_TRANSACTION = {
  amount: '7758176404715800194',
  asset_id: '0x57d05d11b570fd197b55746070ee051c731ee109b07255eab3c9cf8b6c579d',
  expiration_timestamp: '2404381470',
  nonce: '2195908194',
  receiver_position_id: '6091063652223914538',
  receiver_public_key:
    '0x259f432e6f4590b9a164106cf6a659eb4862b21fb97d43588561712e8e5216b',
  sender_position_id: '9309829342914403545',
  sender_public_key:
    '0x5b11f6a03410ea710224e3e6250b49816c4def2fa54c83f91762c2445ca5082',
  signature: {
    r: '0x522c43cf1a31efcfa16a27d8dd5f3e5fe2e93d61cb92c7d29c5786a4673fb8c',
    s: '0x5cc6d720489c336bff1143ce56f2f9795bd6e281410a14c3c00397cccb220eb',
  },
  type: 'TRANSFER',
}
const EXAMPLE_FORCED_TRADE_TRANSACTION = {
  amount_collateral: '8421111986963132424',
  amount_synthetic: '8369943845198781687',
  collateral_asset_id:
    '0x57d05d11b570fd197b55746070ee051c731ee109b07255eab3c9cf8b6c579d',
  is_party_a_buying_synthetic: false,
  is_valid: true,
  nonce:
    '3373718332774959287623786043317526079127737500542171698453575548630802910735',
  position_id_party_a: '15544993694147369147',
  position_id_party_b: '7805344658822197847',
  public_key_party_a:
    '0x4f7e096f22be374f374e2e7f9e366eeecfcc2828ae78ab5fb30dafbe79776b8',
  public_key_party_b:
    '0x4e2db811e2e04a7887cd24903043c4f6cbf679f42727a4b0b3e8e7f50614a6b',
  synthetic_asset_id: '0x4254432d3130000000000000000000',
  type: 'FORCED_TRADE',
}
const EXAMPLE_FORCED_WITHDRAWAL_TRANSACTION = {
  amount: '12415160654910024058',
  is_valid: true,
  position_id: '10777705002482314164',
  public_key:
    '0x45de7d62b1512a48254b7cec7844701606652eb0567020155a611603cc3002d',
  type: 'FORCED_WITHDRAWAL',
}
const EXAMPLE_CONDITIONAL_TRANSFER_TRANSACTION = {
  amount: '20000000',
  nonce: '4095157464',
  sender_public_key:
    '0x4ad4109a1643fd5e7df391c46ef1c5b46825c53483d4b1f4eadc09da16cb93e',
  sender_position_id: '350215810603549246',
  receiver_public_key:
    '0x2b74139b5085e36cba7e59f0fdccda639c2e8b3d0df8063feb7d27bcefe7237',
  receiver_position_id: '353443241267298871',
  asset_id: '0xa21edc9d9997b1b1956f542fe95922518a9e28ace11b7b2972a1974bf5971f',
  expiration_timestamp: '462148',
  fact_registry_address: '0x5070F5d37419AEAd10Df2252421e457336561269',
  fact: 'b01aa2861aa82e4c95753b260c2ab47ccb56e7da6f945b9217411af2ce55d16d',
  signature: {
    s: '0x459d38e70ffb1ff6943bc971be791eba302eed0c1e9683d8614cd65f80c35e4',
    r: '0x158d7ab1c35f6637d272c9c87c0b29d83b8616e6ffe1cc18e0bccc728c1e59f',
  },
  type: 'CONDITIONAL_TRANSFER',
}
const EXAMPLE_WITHDRAWAL_TO_ADDRESS_TRANSACTION = {
  amount: '1682637359498011204',
  eth_address: '0xB6aD5EfBd6aDfa29dEfad5BC0f8cE0ad57d4c5Fb',
  expiration_timestamp: '2101470722',
  nonce: '4265854110',
  position_id: '7758176404715800194',
  public_key:
    '0x1b9e4c42a399f6ce069127df5ad618489aad21b1687acf4d4b09e08744084a7',
  signature: {
    r: '0x18326a6181a507f701968f45f56799b890374a1e329c6b9a37ec3292d92b1f8',
    s: '0x66dd6745be06d033149a2bcb686e3ec896fc914ff2cb52dcc1d34bbe220b639',
  },
  type: 'WITHDRAWAL_TO_ADDRESS',
}
const EXAMPLE_DEPOSIT_TRANSACTION = {
  position_id: '354906804565573997',
  public_key:
    '0x27030ace07f5aa93bc67449a59fc97fd89d55a57156192545669b31afed576d',
  amount: '1000000000',
  type: 'DEPOSIT',
}
const EXAMPLE_DELEVERAGE_TRANSACTION = {
  amount_collateral: '5721212930748269353',
  amount_synthetic: '9309829342914403545',
  deleveraged_position_id: '7758176404715800194',
  deleverager_is_buying_synthetic: false,
  deleverager_position_id: '15308084094301570617',
  synthetic_asset_id: '0x4254432d3130000000000000000000',
  type: 'DELEVERAGE',
}
const EXAMPLE_MULTI_TRANSACTION = {
  txs: [
    {
      amount: '2569146471088859254',
      position_id: '7758176404715800194',
      public_key:
        '0x37ebdcde87a1613e443df789558867f5ba91faf7a024204f7c1bd874da5e70a',
      type: 'DEPOSIT',
    },
    {
      amount: '13942126818862981423',
      asset_id:
        '0x57d05d11b570fd197b55746070ee051c731ee109b07255eab3c9cf8b6c579d',
      expiration_timestamp: '2628077981',
      nonce: '3874773259',
      receiver_position_id: '11534118754833929857',
      receiver_public_key:
        '0x66194cbd71037d1b83e90ec17e0aa3c03983ca8ea7e9d498c778ea6eb2083e7',
      sender_position_id: '10326739782786242647',
      sender_public_key:
        '0x37f0a10832f7711ecde68eb5f115912487b3ed542a3ec49e2afbd4010ec940f',
      signature: {
        r: '0x23108408a83c1cd4f80a1d7ce2ea651a3168f4f1ca46282c1081f0ad5417dcb',
        s: '0x6f0004e07550397a51b079e485cd348aab8cc8094c79fb756671a043da9092d',
      },
      type: 'TRANSFER',
    },
  ],
  type: 'MULTI_TRANSACTION',
}
const ALL_EXAMPLE_TRANSACTIONS = [
  EXAMPLE_TRADE_TRANSACTION,
  EXAMPLE_ORACLE_PRICES_TICK_TRANSACTION,
  EXAMPLE_FUNDING_TICK_TRANSACTION,
  EXAMPLE_LIQUIDATE_TRANSACTION,
  EXAMPLE_TRANSFER_TRANSACTION,
  EXAMPLE_FORCED_TRADE_TRANSACTION,
  EXAMPLE_FORCED_WITHDRAWAL_TRANSACTION,
  EXAMPLE_CONDITIONAL_TRANSFER_TRANSACTION,
  EXAMPLE_WITHDRAWAL_TO_ADDRESS_TRANSACTION,
  EXAMPLE_DEPOSIT_TRANSACTION,
  EXAMPLE_DELEVERAGE_TRANSACTION,
  EXAMPLE_MULTI_TRANSACTION,
]
export const EXAMPLE_PERPETUAL_TRANSACTION_BATCH = {
  previous_batch_id: 12171,
  sequence_number: 10959,
  time_created: '1659603558',
  previous_position_root:
    '02b4848a6f620583b377438ae862e71273bfda2ce3026ddfd6697bf91bb3f83b',
  previous_order_root:
    '00d1ccdfe53e9f4261e5b611e694ad52384cef129e3ad7898e5e27b27c83342a',
  position_root:
    '069e1d10dee11eefd25ec6cb5137af3cf58c8618d19cb614ef26c12375453699',
  order_root:
    '020871c8713281f2966641eb83b02f30235d41f343d9db3ced9115e396e668bc',
  txs_info: ALL_EXAMPLE_TRANSACTIONS.map((transaction, index) => ({
    alt_txs: null,
    original_tx_id: 4000 + index,
    was_replaced: false,
    original_tx: transaction,
  })),
}

export const EXAMPLE_PERPETUAL_TRANSACTIONS = {
  count: ALL_EXAMPLE_TRANSACTIONS.length,
  txs: ALL_EXAMPLE_TRANSACTIONS.map((transaction, index) => ({
    apex_id: index + 1,
    tx_info: JSON.stringify({
      tx: transaction,
      tx_id: 4000 + index,
    }),
  })),
}

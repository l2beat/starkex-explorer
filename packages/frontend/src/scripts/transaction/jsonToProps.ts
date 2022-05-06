import { AssetId, EthereumAddress, StarkKey } from '@explorer/types';

import { PositionAssetEntry } from '../../pages';
import { TransactionFormProps } from '../../pages/transaction-form';

export function jsonToProps(propsJson: unknown): TransactionFormProps {
  function assert(premise: boolean): asserts premise {
    if (!premise) {
      throw new Error('Cannot read props');
    }
  }

  assert(typeof propsJson === 'object' && propsJson !== null);
  const record = propsJson as Record<string, unknown>;
  assert(typeof record.account === 'string');
  assert(typeof record.positionId === 'string');
  assert(typeof record.publicKey === 'string');
  assert(typeof record.selectedAsset === 'string');
  assert(Array.isArray(record.assets));

  function jsonToAsset(assetJson: unknown): PositionAssetEntry {
    assert(typeof assetJson === 'object' && assetJson !== null);
    const record = assetJson as Record<string, unknown>;
    assert(typeof record.assetId === 'string');
    assert(typeof record.balance === 'string');
    assert(typeof record.priceUSDCents === 'string');
    assert(typeof record.totalUSDCents === 'string');
    return {
      assetId: AssetId(record.assetId),
      balance: BigInt(record.balance),
      priceUSDCents: BigInt(record.priceUSDCents),
      totalUSDCents: BigInt(record.totalUSDCents),
    };
  }

  return {
    account: EthereumAddress(record.account),
    positionId: BigInt(record.positionId),
    publicKey: StarkKey(record.publicKey),
    selectedAsset: AssetId(record.selectedAsset),
    assets: record.assets.map(jsonToAsset),
  };
}

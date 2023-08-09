import { MerkleProof, PositionLeaf } from '@explorer/state'
import { AssetId, PedersenHash, StarkKey } from '@explorer/types'
import { expect } from 'earl'

import { serializeMerkleProofForEscape } from './serializeMerkleProofForEscape'

describe(serializeMerkleProofForEscape.name, () => {
  it('should serialize a merkle proof', () => {
    const positionLeaf = new PositionLeaf(StarkKey.fake('beef'), 69n, [
      { assetId: AssetId('BTC-10'), balance: 3n, fundingIndex: 4n },
    ])

    const perpetualMerkleProof: MerkleProof<PositionLeaf> = {
      leaf: positionLeaf,
      leafIndex: 7n,
      leafPrefixLength: 3,
      path: [
        {
          left: PedersenHash(
            '0000000000000000000000000000000000000000000000000000000000000000'
          ),
          right: PedersenHash(
            '004254432d313000000000000000000080000000000000048000000000000003'
          ),
        },
        {
          left: PedersenHash(
            '0726c9603ac7bccf9523718f2f1b45fac7673780ae5089ecf2ab0e67f96f7dd0'
          ),
          right: PedersenHash(
            '0beef00000000000000000000000000000000000000000000000000000000000'
          ),
        },
        {
          left: PedersenHash(
            '0271eb38f2bf004c2407a88958620a5d2c25fcee84590e50f0d2e37858bfba62'
          ),
          right: PedersenHash(
            '0000000000000000000000000000000000000000000080000000000000450001'
          ),
        },
        {
          left: PedersenHash(
            '028109b4e56fad0455aa4b316045c93937b1e7e4e0fc663db375b9e67c80c620'
          ),
          right: PedersenHash(
            '040e52d372a32b20035f44f456e7beea936b35298c64f5b8d6a56604ff4b3a6d'
          ),
        },
        {
          left: PedersenHash(
            '037ff447129584d02735f8b24db6d39dfc7d1ccbd7459fca871b795bffbeddf2'
          ),
          right: PedersenHash(
            '00968c9e36fd542708ca7d03ce09b81835ee1da53d50faa4bba820b28da6f93e'
          ),
        },
        {
          left: PedersenHash(
            '07d54313f8a6085c0f072dab5a3bbb28132f74b4adc3a00238c465163d052ed4'
          ),
          right: PedersenHash(
            '0490d6399cb336c5b4f017c608cdf662dba1942fbbc9c744d7e1cdda5feedaf9'
          ),
        },
      ],
      perpetualAssetCount: 1,
      root: PedersenHash(
        '00c9c74a31d9247f04cc9dbef31686d072fec342810c56d53855fa81e7af4bfd'
      ),
      starkKey: StarkKey.fake('beef'),
    }

    expect(serializeMerkleProofForEscape(perpetualMerkleProof)).toEqual([
      0n,
      30001526795319849252324097071977050905586053462486420188706939170735295300352n,
      51755519582484935180678720569846960714349028541078472964416237606474853375243n,
      108074501258364212671951141525442839776135535004087860430382408120666966458368n,
      17694445779186356052184739537155289443108441618591601491420520392058218456608n,
      154742504910672535520018688n,
      18121855379086738056127543246288844289035300259056337124023244527956344463876n,
      6478720698574293975535197600228144301494206361683389185958982644949786979584n,
      25328225043177823319220877681895856553959192982182631511906782068825060663072n,
      68095377834997473110967502460299490343402840164279191569551851314365135928832n,
      56687861124970118891962212466772367015533463385725521495813263122984365911364n,
      65511553092019813532680860505595526153543086133745386269528099820127758514432n,
      5704187325266392042567303450826654811460944722812564435329740863596318212048n,
      14336n,
    ])
  })
})

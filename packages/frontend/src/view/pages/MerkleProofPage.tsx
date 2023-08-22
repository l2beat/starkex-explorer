import { PageContext } from '@explorer/shared'
import { PedersenHash } from '@explorer/types'
import React from 'react'

import { Card } from '../components/Card'
import { LongHash } from '../components/LongHash'
import { OrderedList } from '../components/OrderedList'
import { ContentWrapper } from '../components/page/ContentWrapper'
import { Page } from '../components/page/Page'
import { PageTitle } from '../components/PageTitle'
import { reactToHtml } from '../reactToHtml'

interface MerkleProofPageProps {
  positionOrVaultId: bigint
  context: PageContext
  merkleProof: MerkleProof
}

interface MerkleProof {
  rootHash: PedersenHash
  path: MerkleProofPath[]
  leaf: string
}

interface MerkleProofPath {
  left: PedersenHash
  right: PedersenHash
}

function MerkleProofPage(props: MerkleProofPageProps) {
  const idLabel =
    props.context.tradingMode === 'perpetual' ? 'Position' : 'Vault'
  const formattedLeaf = JSON.stringify(
    JSON.parse(props.merkleProof.leaf),
    null,
    2
  )

  return (
    <Page
      title="Merkle Proof"
      description={`Merkle proof for #${props.positionOrVaultId.toString()} ${idLabel} made from the latest state update`}
      path={`/proof/${props.positionOrVaultId.toString()}`}
      context={props.context}
    >
      <ContentWrapper className="flex flex-col gap-12">
        <div>
          <PageTitle>
            Merkle Proof for {idLabel} #{props.positionOrVaultId.toString()}
          </PageTitle>
          <span className="text-sm font-semibold text-zinc-500">
            Merkle proofs provide a way to verify the existence and correctness
            of data within a Merkle tree. In the context of trading, they are
            used to prove that a specific {idLabel.toLowerCase()} exists in the
            latest state update. By using Merkle proofs, users can trust the
            integrity of the data they receive without having to store or
            validate the entire state of the system.
          </span>
        </div>
        <div>
          <span className="text-xl font-semibold">Root Hash</span>
          <Card className="mt-2">
            <LongHash>0x{props.merkleProof.rootHash.toString()}</LongHash>
          </Card>
        </div>
        <div>
          <span className="text-xl font-semibold">Leaf</span>
          <Card className="mt-2">
            <span className="whitespace-pre-line break-words">
              {formattedLeaf}
            </span>
          </Card>
        </div>
        <div>
          <span className="text-xl font-semibold">Path</span>
          <Card className="mt-2 flex flex-col gap-2">
            <OrderedList
              items={props.merkleProof.path.map((path, index) => (
                <div key={index} className="flex flex-col">
                  <LongHash>Left: 0x{path.left.toString()}</LongHash>
                  <LongHash>Right: 0x{path.right.toString()}</LongHash>
                </div>
              ))}
            />
          </Card>
        </div>
      </ContentWrapper>
    </Page>
  )
}

export function renderMerkleProofPage(props: MerkleProofPageProps) {
  return reactToHtml(<MerkleProofPage {...props} />)
}

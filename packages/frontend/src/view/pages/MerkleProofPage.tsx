import { TradingMode, UserDetails } from '@explorer/shared'
import { PedersenHash } from '@explorer/types'
import React from 'react'

import { Card } from '../components/Card'
import { OrderedList } from '../components/OrderedList'
import { ContentWrapper } from '../components/page/ContentWrapper'
import { Page } from '../components/page/Page'
import { PageTitle } from '../components/PageTitle'
import { reactToHtml } from '../reactToHtml'

export interface MerkleProofPageProps {
  positionOrVaultId: bigint
  user: UserDetails | undefined
  tradingMode: TradingMode
  merkleProof: MerkleProof
}

interface MerkleProof {
  rootHash: PedersenHash
  path: MerkleProofPath[]
  leaf: string
}

export interface MerkleProofPath {
  left: PedersenHash
  right: PedersenHash
}

function MerkleProofPage(props: MerkleProofPageProps) {
  const idLabel = props.tradingMode === 'perpetual' ? 'Position' : 'Vault'
  const formattedLeaf = JSON.stringify(
    JSON.parse(props.merkleProof.leaf),
    null,
    2
  )
  return (
    <Page
      title="Merkle Proof"
      description={`Merkle proof for #${props.positionOrVaultId.toString()} ${
        props.tradingMode === 'perpetual' ? 'position' : 'vault'
      } made from the latest state update`}
      path={`/proof/${props.positionOrVaultId.toString()}`}
      user={props.user}
    >
      <ContentWrapper className="flex flex-col gap-12">
        <div>
          <PageTitle>
            Merkle Proof for {idLabel} #{props.positionOrVaultId.toString()}
          </PageTitle>
          <span className="text-sm font-semibold text-zinc-500">
            {/* TODO: add some explanation */}
            Sit do eu officia incididunt amet id occaecat mollit tempor nulla.
            Laborum commodo velit id nisi voluptate ex quis ullamco fugiat
            laboris et. Esse est reprehenderit veniam nisi magna nulla amet sint
            do magna. Sint commodo veniam sunt ullamco sunt esse exercitation
            adipisicing voluptate aute adipisicing amet quis incididunt. Minim
            mollit anim eiusmod adipisicing minim cillum nostrud pariatur eu
            sunt fugiat aliqua.
          </span>
        </div>
        <div>
          <span className="text-xl font-semibold">Root Hash</span>
          <Card className="mt-2">
            <p>{props.merkleProof.rootHash}</p>
          </Card>
        </div>
        <div>
          <span className="text-xl font-semibold">Leaf</span>
          <Card className="mt-2">
            <pre>{formattedLeaf}</pre>
          </Card>
        </div>
        <div>
          <span className="text-xl font-semibold">Path</span>
          <Card className="mt-2 flex flex-col gap-2">
            <OrderedList
              items={props.merkleProof.path.map((path, index) => (
                <div key={index}>
                  <p>Left: {path.left}</p>
                  <p>Right: {path.right}</p>
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

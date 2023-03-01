import { UserDetails } from '@explorer/shared'
import { PedersenHash } from '@explorer/types'
import React from 'react'

import { Card } from '../../components/Card'
import { OrderedList } from '../../components/OrderedList'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { PageTitle } from '../../components/PageTitle'
import { reactToHtml } from '../../reactToHtml'

export interface StateUpdateMerkleProofPageProps {
  id: string
  user: UserDetails | undefined
  type: 'PERPETUAL' | 'SPOT'
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

function StateUpdateMerkleProofPage(props: StateUpdateMerkleProofPageProps) {
  const idLabel = props.type === 'SPOT' ? 'Vault' : 'Position'
  const formattedJson = JSON.stringify(
    JSON.parse(props.merkleProof.leaf),
    null,
    2
  )
  return (
    <Page
      title="Merkle Proof"
      description="TODO: description"
      path="/lol"
      user={props.user}
    >
      <ContentWrapper className="flex flex-col gap-6">
        <PageTitle>
          Merkle Proof for {idLabel} #{props.id}
        </PageTitle>
        <div>
          <span className="text-xl font-semibold">Root Hash</span>
          <Card className="mt-2">
            <p>{props.merkleProof.rootHash}</p>
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
        <div>
          <span className="text-xl font-semibold">Leaf</span>
          <Card className="mt-2">
            <pre>{formattedJson}</pre>
          </Card>
        </div>
      </ContentWrapper>
    </Page>
  )
}

export function renderStateUpdateMerkleProofPage(
  props: StateUpdateMerkleProofPageProps
) {
  return reactToHtml(<StateUpdateMerkleProofPage {...props} />)
}

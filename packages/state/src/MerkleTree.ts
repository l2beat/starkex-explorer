interface MerkleUpdate {
  id: number
  value: number
}

export class MerkleLeaf {
  constructor(readonly value: number) {}

  update(values: MerkleUpdate[]) {
    if (values.length !== 1) {
      throw new Error('Update must always only have a single value')
    }
    return new MerkleLeaf(values[0].value)
  }
}

export class MerkleNode {
  constructor(
    readonly left: MerkleNode | MerkleLeaf,
    readonly right: MerkleNode | MerkleLeaf
  ) {}

  update(values: MerkleUpdate[], center: number, height: number): MerkleNode {
    const leftUpdates = values.filter((x) => x.id < center)
    const rightUpdates = values.filter((x) => x.id >= center)
    const offset = 2 ** (height - 2)
    console.log('update', {center, height, offset})
    const newLeft =
      leftUpdates.length > 0
        ? this.left.update(leftUpdates, center - offset, height - 1)
        : this.left
    const newRight =
      rightUpdates.length > 0
        ? this.right.update(rightUpdates, center + offset, height - 1)
        : this.right
    return new MerkleNode(newLeft, newRight)
  }
}

export class MerkleTree {
  public root: MerkleNode
  constructor(readonly height: number) {
    const leaf = new MerkleLeaf(0)
    let node = new MerkleNode(leaf, leaf)
    for (let i = 2; i < height; i++) {
      node = new MerkleNode(node, node)
    }
    this.root = node
  }

  getValues(node: MerkleNode | MerkleLeaf = this.root): number[] {
    if (node instanceof MerkleNode) {
      return [...this.getValues(node.left), ...this.getValues(node.right)]
    } else {
      return [node.value]
    }
  }

  update(values: MerkleUpdate[]) {
    if (values.length === 0) {
      return
    }
    const center = 2 ** (this.height - 2)
    this.root = this.root.update(values, center, this.height - 1)
  }
}

const tree = new MerkleTree(6)
console.log(tree.getValues())
tree.update([
  { id: 17, value: 8},
  { id: 10, value: 1},
  { id: 11, value: 2},
  { id: 13, value: 4},
  { id: 12, value: 3},
  { id: 15, value: 6},
  { id: 16, value: 7},
  { id: 14, value: 5},
])
console.log(tree.getValues())

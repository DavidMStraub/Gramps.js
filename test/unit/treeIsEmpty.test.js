import {describe, it, expect} from 'vitest'
import {treeIsEmpty} from '../../src/util.js'

describe('treeIsEmpty', () => {
  it('is true when every object count is zero', () => {
    expect(treeIsEmpty({object_counts: {people: 0, families: 0, notes: 0}})).to
      .be.true
  })

  it('is false when any object count is non-zero', () => {
    expect(treeIsEmpty({object_counts: {people: 0, notes: 3}})).to.be.false
  })

  it('is false while the counts are unknown', () => {
    expect(treeIsEmpty({})).to.be.false
    expect(treeIsEmpty(undefined)).to.be.false
  })
})

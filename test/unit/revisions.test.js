import {describe, it, expect} from 'vitest'
import {
  groupByDay,
  countChanges,
} from '../../src/views/GrampsjsViewRevisions.js'

const at = (y, m, d, h = 12) => ({
  id: `${y}-${m}-${d}-${h}`,
  timestamp: new Date(y, m, d, h).getTime() / 1000,
})

describe('revisions: day groups', () => {
  it('groups consecutive transactions of the same local day', () => {
    const txns = [
      at(2026, 10, 13, 23),
      at(2026, 10, 13, 0),
      at(2026, 10, 12, 18),
      at(2025, 10, 12, 18),
    ]
    const groups = groupByDay(txns)
    expect(groups.map(g => g.transactions.map(t => t.id))).toEqual([
      ['2026-10-13-23', '2026-10-13-0'],
      ['2026-10-12-18'],
      ['2025-10-12-18'],
    ])
    expect(groups[0].date.getDate()).toBe(13)
  })

  it('returns no groups for no transactions', () => {
    expect(groupByDay([])).toEqual([])
  })
})

describe('revisions: change counts', () => {
  it('counts changes per object class and change type', () => {
    expect(
      countChanges([
        {obj_class: 'Person', trans_type: 0},
        {obj_class: 'Person', trans_type: 0},
        {obj_class: 'Event', trans_type: 1},
      ])
    ).toEqual({Person_0: 2, Event_1: 1})
  })

  it('handles missing changes', () => {
    expect(countChanges(undefined)).toEqual({})
  })
})

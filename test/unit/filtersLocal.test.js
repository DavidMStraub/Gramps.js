import {describe, it, expect} from 'vitest'
import {GrampsjsFilters} from '../../src/components/GrampsjsFilters.js'
import {tagFilter, textFilter} from '../../src/filterDefinitions.js'
import {taskStatusFilter} from '../../src/taskConstants.js'
import {newCondition, newGroup} from '../../src/filterBuilder.js'

const _ = s => s
const title = textFilter(_, {label: 'Title', rule: 'MatchesTitleSubstringOf'})
const status = taskStatusFilter(_)
const titleRule = {name: 'MatchesTitleSubstringOf', values: ['x']}
const doneRule = {name: 'Status', values: ['Done']}

// a filter bar that is never rendered, holding a title and a status pill
function makeFilters() {
  const filters = new GrampsjsFilters()
  filters.definitions = [title, status, tagFilter(_)]
  filters._pills = [
    {sectionId: status.id, rule: doneRule},
    {sectionId: title.id, rule: titleRule},
  ]
  filters.events = []
  filters.addEventListener('filters:changed', e =>
    filters.events.push(e.detail)
  )
  return filters
}

describe('GrampsjsFilters local sections', () => {
  it('keeps the rules of local sections from the server rules', () => {
    const filters = makeFilters()
    expect(filters.filters).toEqual([titleRule])
    expect(filters.localFilters).toEqual([doneRule])
  })

  it('reports both kinds of rules', () => {
    const filters = makeFilters()
    filters._removePill(1)
    expect(filters.events).toEqual([{filters: [], localFilters: [doneRule]}])
  })

  it('keeps the local pills when the advanced filter is applied', () => {
    const filters = makeFilters()
    const tree = newGroup('or')
    tree.children = [
      newCondition('HasTag', ['ToDo']),
      newCondition('MatchesTitleSubstringOf', ['y']),
    ]
    filters._handleBuilderApply({detail: {tree}})
    expect(filters._tree).toBe(tree)
    expect(filters._pills).toEqual([{sectionId: status.id, rule: doneRule}])
    expect(filters.events[0].localFilters).toEqual([doneRule])
    expect(filters.events[0].filters).not.toContainEqual(doneRule)
  })

  it('never maps advanced filter rules to local sections', () => {
    const filters = makeFilters()
    const tree = newGroup('and')
    tree.children = [newCondition('Status', ['Done'])]
    filters._handleBuilderApply({detail: {tree}})
    expect(filters._tree).toBe(tree)
  })
})

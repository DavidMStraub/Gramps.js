import {describe, it, expect} from 'vitest'
import {pageTitleParts, pageTitleDetail} from '../../src/routing.js'

describe('pageTitleParts', () => {
  it('names the home page', () => {
    expect(pageTitleParts({page: 'home', pageId: ''})).toEqual([
      {title: 'Home'},
    ])
  })

  it('puts list pages under Lists', () => {
    expect(pageTitleParts({page: 'people', pageId: ''})).toEqual([
      {title: 'Lists', href: '/people'},
      {title: 'People'},
    ])
  })

  it('leads from an object page to its list', () => {
    expect(pageTitleParts({page: 'person', pageId: 'I0044'})).toEqual([
      {title: 'People', href: '/people'},
      {title: 'I0044', literal: true},
    ])
  })

  it('leads from a media object to the media list', () => {
    expect(pageTitleParts({page: 'media', pageId: 'O0001'})[0]).toEqual({
      title: 'Media',
      href: '/medialist',
    })
  })

  it('leads from a task and a revision to their lists', () => {
    expect(pageTitleParts({page: 'task', pageId: 'S0001'})[0].href).toBe(
      '/tasks'
    )
    expect(pageTitleParts({page: 'revision', pageId: '12'})[0].href).toBe(
      '/revisions'
    )
  })

  it('names the settings tab', () => {
    expect(pageTitleParts({page: 'settings', pageId: 'users'})).toEqual([
      {title: 'Settings', href: '/settings/user'},
      {title: 'Manage users'},
    ])
  })

  it('names a page by its title alone', () => {
    expect(pageTitleParts({page: 'map', pageId: ''})).toEqual([{title: 'Map'}])
  })

  it('leaves pages without a title empty', () => {
    expect(pageTitleParts({page: 'new_person', pageId: ''})).toEqual([])
  })

  it('leads from a report to the reports once its name is known', () => {
    const path = {page: 'report', pageId: 'ancestor_chart'}
    expect(pageTitleParts(path)).toEqual([{title: '_Reports'}])
    expect(pageTitleParts(path, 'Ancestor Tree')).toEqual([
      {title: '_Reports', href: '/reports'},
      {title: 'Ancestor Tree'},
    ])
  })
})

describe('pageTitleDetail', () => {
  const reported = {page: 'report', pageId: 'ancestor_chart', title: 'X'}

  it('returns the title reported for the current page', () => {
    expect(
      pageTitleDetail({page: 'report', pageId: 'ancestor_chart'}, reported)
    ).toBe('X')
  })

  it('ignores a title reported for another page', () => {
    expect(
      pageTitleDetail({page: 'report', pageId: 'family_group'}, reported)
    ).toBe('')
    expect(pageTitleDetail({page: 'reports', pageId: ''}, reported)).toBe('')
    expect(pageTitleDetail({page: 'report', pageId: 'x'}, null)).toBe('')
  })
})

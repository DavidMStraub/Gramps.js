import {describe, it, expect, vi} from 'vitest'
import {GrampsjsViewNotificationLog} from '../../src/views/GrampsjsViewNotificationLog.js'

const makeLog = () => {
  const element = new GrampsjsViewNotificationLog()
  element.appState = {i18n: {strings: {}}}
  return element
}

describe('notification log: task entries', () => {
  it('states the outcome of finished tasks', () => {
    const log = makeLog()

    expect(log._sourceLabel({source: 'task', type: 'success'})).toBe(
      'Task completed'
    )
    expect(log._sourceLabel({source: 'task', type: 'error'})).toBe(
      'Task failed'
    )
    expect(log._sourceLabel({source: 'task', type: 'warning'})).toBe('Task')
    expect(log._sourceLabel({source: 'api', type: 'error'})).toBe('Network')
  })

  it('shows the message of a failed task', () => {
    const log = makeLog()
    const failed = detail => ({source: 'task', type: 'error', detail})

    expect(
      log._failureMessage(failed({info: 'boom', result_object: 'x'}))
    ).toBe('boom')
    expect(log._failureMessage(failed({info: null, result_object: 'x'}))).toBe(
      'x'
    )
    expect(
      log._failureMessage(failed({info: '', result_object: {code: 1}}))
    ).toBe('')
    expect(
      log._failureMessage(
        failed({
          info: '{"error": {"code": 500, "message": "Import failed"}}',
          result_object: {error: {code: 500, message: 'Import failed'}},
        })
      )
    ).toBe('Import failed')
    expect(
      log._failureMessage({source: 'api', type: 'error', detail: {info: 'a'}})
    ).toBe('')
  })
})

describe('notification log: export downloads', () => {
  const finished = detail => ({source: 'task', type: 'success', detail})
  const gramps = finished({
    file_name: 'abc.gramps',
    file_type: '.gramps',
    messages: [],
    url: '/api/exporters/gramps/file/processed/abc.gramps',
  })
  const media = finished({
    file_name: 'def.zip',
    file_size: 10,
    url: '/api/media/archive/def.zip',
  })

  it('offers finished exports and media archives for download', () => {
    const log = makeLog()

    expect(log._downloadUrl(gramps)).toBe(
      '/api/exporters/gramps/file/processed/abc.gramps'
    )
    expect(log._downloadUrl(media)).toBe('/api/media/archive/def.zip')
  })

  it('offers no download for other notifications', () => {
    const log = makeLog()

    expect(log._downloadUrl(finished({url: 'https://example.com/x'}))).toBe('')
    expect(log._downloadUrl(finished({url: '/api/people/'}))).toBe('')
    expect(log._downloadUrl(finished({}))).toBe('')
    expect(log._downloadUrl({...gramps, type: 'error'})).toBe('')
    expect(log._downloadUrl({...gramps, source: 'api'})).toBe('')
  })

  it('names the files like the Export page', () => {
    const log = makeLog()

    expect(log._downloadFileName(gramps)).toBe('grampsweb-export.gramps')
    expect(log._downloadFileName(media)).toBe('grampsweb-media-export.zip')
    expect(
      log._downloadFileName(
        finished({file_name: 'x.ged', url: '/api/exporters/ged/file/x.ged'})
      )
    ).toBe('x.ged')
  })

  it('downloads with a fresh token', async () => {
    const log = makeLog()
    log.appState.refreshTokenIfNeeded = vi.fn().mockResolvedValue(undefined)
    const anchor = document.createElement('a')
    anchor.click = vi.fn()
    log.renderRoot = {querySelector: () => anchor}

    await log._download(media)

    expect(log.appState.refreshTokenIfNeeded).toHaveBeenCalled()
    expect(anchor.getAttribute('href')).toMatch(
      /\/api\/media\/archive\/def\.zip\?jwt=/
    )
    expect(anchor.download).toBe('grampsweb-media-export.zip')
    expect(anchor.click).toHaveBeenCalled()
  })
})

describe('notification log: changes by other users', () => {
  const change = {
    source: 'history',
    type: 'info',
    message: 'Edit Person',
    detail: {transactionId: 42},
  }

  it('links to the revision', () => {
    const log = makeLog()
    expect(log._href(change)).toBe('/revision/42')
    expect(log._itemType(change)).toBe('link')
    expect(log._sourceLabel(change)).toBe('Revisions')
  })

  it('translates the description', () => {
    const log = makeLog()
    log.appState = {i18n: {strings: {'Edit Person': 'Person bearbeiten'}}}
    expect(log._message(change)).toBe('Person bearbeiten')
    expect(log._message({...change, source: 'api'})).toBe('Edit Person')
  })

  it('counts several changes and links to the revisions', () => {
    const log = makeLog()
    const several = {...change, message: '', detail: {count: 3}}
    expect(log._message(several)).toBe('3 changes')
    expect(log._href(several)).toBe('/revisions')
    expect(log._itemType(several)).toBe('link')
  })

  it('keeps the detail dialog for other entries', () => {
    const log = makeLog()
    const error = {source: 'api', type: 'error', detail: {status: 500}}
    expect(log._href(error)).toBe('')
    expect(log._itemType(error)).toBe('button')
    expect(log._itemType({...error, detail: {}})).toBe('text')
  })
})

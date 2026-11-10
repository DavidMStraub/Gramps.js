import {describe, it, expect, afterEach} from 'vitest'
import {isInside} from '../../src/dialogTracking.js'

describe('dialog tracking', () => {
  const events = []
  window.addEventListener('dialogs:changed', event => events.push(event))
  const lastDialogs = () => events.at(-1)?.detail.dialogs

  afterEach(() => {
    document.body.innerHTML = ''
    events.length = 0
  })

  it('reports a dialog as open until it closes', async () => {
    const dialog = document.createElement('md-dialog')
    document.body.append(dialog)
    dialog.open = true
    await dialog.updateComplete
    expect(lastDialogs()).toEqual([dialog])
    dialog.open = false
    await dialog.updateComplete
    expect(lastDialogs()).toEqual([])
  })

  it('reports nothing for a dialog that stays closed', async () => {
    const dialog = document.createElement('md-dialog')
    document.body.append(dialog)
    await dialog.updateComplete
    expect(events).toHaveLength(0)
  })

  it('tells whether a node lies within a host across shadow roots', () => {
    const host = document.createElement('div')
    const inner = document.createElement('span')
    host.attachShadow({mode: 'open'}).append(inner)
    document.body.append(host)
    expect(isInside(inner, host)).toBe(true)
    expect(isInside(host, inner)).toBe(false)
  })
})

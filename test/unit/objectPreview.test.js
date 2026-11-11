import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import '../../src/components/GrampsjsObjectPreview.js'
import {fireEvent} from '../../src/util.js'

const anchorRect = {left: 0, right: 10, top: 0, bottom: 10}

const show = detail =>
  fireEvent(window, 'object:preview-show', {
    objectType: 'family',
    grampsId: 'F0001',
    anchorRect,
    chart: true,
    ...detail,
  })

describe('GrampsjsObjectPreview', () => {
  let preview

  beforeEach(async () => {
    vi.useFakeTimers()
    preview = document.createElement('grampsjs-object-preview')
    preview.appState = {
      path: 'tree',
      i18n: {lang: 'en', strings: {}},
      apiGet: async () => ({data: []}),
    }
    document.body.append(preview)
    await preview.updateComplete
  })

  afterEach(() => {
    preview.remove()
    vi.useRealTimers()
  })

  it('shows a hover preview after a delay and hides it on leave', () => {
    show()
    expect(preview._visible).toBe(false)
    vi.advanceTimersByTime(500)
    expect(preview._visible).toBe(true)
    fireEvent(window, 'object:preview-hide')
    vi.advanceTimersByTime(250)
    expect(preview._visible).toBe(false)
  })

  it('shows a pinned preview at once and keeps it when the pointer leaves', () => {
    show({pinned: true})
    expect(preview._visible).toBe(true)
    fireEvent(window, 'object:preview-hide')
    preview._handlePopupMouseLeave()
    vi.advanceTimersByTime(1000)
    expect(preview._visible).toBe(true)
  })

  it('keeps a pinned preview when another object is hovered', () => {
    show({pinned: true})
    show({grampsId: 'F0002'})
    vi.advanceTimersByTime(1000)
    expect(preview._grampsId).toBe('F0001')
  })

  it('closes a pinned preview on a press outside and unpins it', () => {
    show({pinned: true})
    document.body.dispatchEvent(new Event('pointerdown', {bubbles: true}))
    expect(preview._visible).toBe(false)
    show()
    vi.advanceTimersByTime(500)
    fireEvent(window, 'object:preview-hide')
    vi.advanceTimersByTime(250)
    expect(preview._visible).toBe(false)
  })

  it('closes a pinned preview on Escape', () => {
    show({pinned: true})
    window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}))
    expect(preview._visible).toBe(false)
  })
})

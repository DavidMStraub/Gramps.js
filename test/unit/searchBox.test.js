import {describe, it, expect, afterEach, beforeEach, vi} from 'vitest'
import '../../src/components/GrampsjsSearchBox.js'

vi.mock('tippy.js', () => ({default: () => ({setContent() {}})}))

const mounted = []

function person(id) {
  return {
    object_type: 'person',
    object: {gramps_id: id, handle: id, profile: {}},
  }
}

async function mount(apiGet) {
  const el = document.createElement('grampsjs-search-box')
  el.appState = {
    i18n: {lang: 'en', strings: {}},
    apiGet,
    permissions: {},
    frontendConfig: {},
  }
  el.events = []
  for (const name of ['nav', 'search-box:done']) {
    el.addEventListener(name, e => el.events.push([name, e.detail]))
  }
  document.body.appendChild(el)
  mounted.push(el)
  await el.updateComplete
  return el
}

async function type(el, value) {
  const input = el.shadowRoot.getElementById('search-input')
  input.value = value
  input.dispatchEvent(new Event('input'))
  await el.updateComplete
}

function key(el, name) {
  el.shadowRoot
    .getElementById('search-input')
    .dispatchEvent(new KeyboardEvent('keydown', {key: name, bubbles: true}))
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  mounted.splice(0).forEach(el => el.remove())
})

describe('GrampsjsSearchBox', () => {
  it('shows the first results while typing', async () => {
    const apiGet = vi.fn(async () => ({
      data: [person('I1'), person('I2')],
      total_count: '12',
    }))
    const el = await mount(apiGet)
    await type(el, 'Gar')
    await vi.advanceTimersByTimeAsync(300)
    await el.updateComplete
    expect(apiGet).toHaveBeenCalledTimes(1)
    const url = new URL(apiGet.mock.calls[0][0], 'http://x')
    expect(url.searchParams.get('pagesize')).toBe('8')
    expect(el.shadowRoot.querySelector('.panel')).not.toBeNull()
    expect(
      el.shadowRoot.querySelector('grampsjs-search-result-list').data
    ).toHaveLength(2)
    expect(el.shadowRoot.querySelector('a.all').textContent).toContain('12')
  })

  it('searches the selected object types only', async () => {
    const apiGet = vi.fn(async () => ({data: [person('I1')], total_count: '1'}))
    const el = await mount(apiGet)
    await type(el, 'Gar')
    await vi.advanceTimersByTimeAsync(300)
    await el.updateComplete
    const button = el.shadowRoot.querySelector('.types button[title="Places"]')
    button.click()
    await vi.advanceTimersByTimeAsync(0)
    await el.updateComplete
    expect(button.getAttribute('aria-pressed')).toBe('true')
    const url = new URL(apiGet.mock.calls.at(-1)[0], 'http://x')
    expect(url.searchParams.get('type')).toBe('place')
  })

  it('does not search for a single character', async () => {
    const apiGet = vi.fn()
    const el = await mount(apiGet)
    await type(el, 'G')
    await vi.advanceTimersByTimeAsync(300)
    expect(apiGet).not.toHaveBeenCalled()
    expect(el.shadowRoot.querySelector('.panel')).toBeNull()
  })

  it('drops the results of an older query', async () => {
    let resolveFirst
    const apiGet = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveFirst = resolve
          })
      )
      .mockResolvedValueOnce({data: [person('I2')], total_count: '1'})
    const el = await mount(apiGet)
    await type(el, 'Ga')
    await vi.advanceTimersByTimeAsync(300)
    await type(el, 'Gar')
    await vi.advanceTimersByTimeAsync(300)
    resolveFirst({data: [person('I1')], total_count: '1'})
    await vi.advanceTimersByTimeAsync(0)
    await el.updateComplete
    const list = el.shadowRoot.querySelector('grampsjs-search-result-list')
    expect(list.data.map(r => r.object.gramps_id)).toEqual(['I2'])
  })

  it('opens the search page with the query on Enter', async () => {
    const el = await mount(vi.fn(async () => ({data: [], total_count: '0'})))
    const queries = []
    const onQuery = e => queries.push(e.detail.query)
    window.addEventListener('search:query', onQuery)
    await type(el, 'Garner ')
    el.shadowRoot
      .querySelector('form')
      .dispatchEvent(new Event('submit', {cancelable: true}))
    await el.updateComplete
    window.removeEventListener('search:query', onQuery)
    expect(queries).toEqual(['Garner'])
    expect(el.events).toContainEqual(['nav', {path: 'search'}])
    expect(el.shadowRoot.getElementById('search-input').value).toBe('')
  })

  it('closes the panel on Escape, then clears the field', async () => {
    const el = await mount(
      vi.fn(async () => ({data: [person('I1')], total_count: '1'}))
    )
    await type(el, 'Gar')
    await vi.advanceTimersByTimeAsync(300)
    await el.updateComplete
    key(el, 'Escape')
    await el.updateComplete
    expect(el.shadowRoot.querySelector('.panel')).toBeNull()
    expect(el.shadowRoot.getElementById('search-input').value).toBe('Gar')
    key(el, 'Escape')
    await el.updateComplete
    expect(el.shadowRoot.getElementById('search-input').value).toBe('')
    expect(el.events.map(([name]) => name)).toContain('search-box:done')
  })
})

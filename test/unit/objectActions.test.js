import {describe, it, expect, afterEach, vi} from 'vitest'
import '../../src/components/GrampsjsObjectActions.js'

// tippy.js cannot find the tooltip targets in happy-dom
vi.mock('tippy.js', () => ({default: () => ({setContent() {}})}))

const mounted = []

async function mount(props) {
  const el = document.createElement('grampsjs-object-actions')
  Object.assign(el, {
    appState: {i18n: {lang: 'en', strings: {}}},
    ...props,
  })
  el.actions = []
  el.addEventListener('edit:action', e => el.actions.push(e.detail))
  document.body.appendChild(el)
  mounted.push(el)
  await el.updateComplete
  return el
}

afterEach(() => {
  mounted.splice(0).forEach(el => el.remove())
})

const $ = (el, selector) => el.shadowRoot.querySelector(selector)

describe('GrampsjsObjectActions privacy', () => {
  it('shows the status without a button outside edit mode', async () => {
    const el = await mount({data: {private: true}})
    expect($(el, '#privacy-status')).not.toBeNull()
    expect($(el, '#btn-private')).toBeNull()
    expect($(el, 'grampsjs-tooltip').content).toBe('Record is private')
    expect($(el, '#privacy-status').getAttribute('aria-label')).toBe(
      'Record is private'
    )
  })

  it('toggles the privacy with the button in edit mode', async () => {
    const el = await mount({data: {private: false}, edit: true})
    expect($(el, '#privacy-status')).toBeNull()
    $(el, '#btn-private').click()
    expect(el.actions).toEqual([{action: 'updateProp', data: {private: true}}])
  })

  it('shows nothing with hideLock', async () => {
    const el = await mount({data: {private: true}, edit: true, hideLock: true})
    expect($(el, '#btn-private')).toBeNull()
    expect($(el, '#privacy-status')).toBeNull()
  })
})

describe('GrampsjsObject toolbar', () => {
  it('shows the toolbar it is given before the heading', async () => {
    const {html} = await import('lit')
    await import('../../src/components/GrampsjsPerson.js')
    const el = document.createElement('grampsjs-person')
    el.appState = {
      i18n: {lang: 'en', strings: {}},
      permissions: {},
      settings: {},
      frontendConfig: {},
      path: {page: 'person'},
      dbInfo: {},
    }
    el.data = {
      handle: 'h',
      gramps_id: 'I0001',
      profile: {name_given: 'A', name_surname: 'B'},
      extended: {},
      backlinks: {},
    }
    el.actions = html`<span id="toolbar"></span>`
    document.body.appendChild(el)
    mounted.push(el)
    await el.updateComplete
    const first = el.shadowRoot.querySelector('.profile').firstElementChild
    expect(first.classList.contains('actions')).toBe(true)
    expect(first.querySelector('#toolbar')).not.toBeNull()
  })
})

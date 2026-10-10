import {describe, it, expect, vi} from 'vitest'
import {GrampsjsFormNewSource} from '../../src/components/GrampsjsFormNewSource.js'
import '../../src/components/GrampsjsFormSelectObject.js'

const makeForm = () => {
  const element = new GrampsjsFormNewSource()
  element.createRenderRoot()
  return element
}

const formDataEvent = (id, detail) => ({
  composedPath: () => [{id}],
  detail,
  preventDefault: () => {},
  stopPropagation: () => {},
})

describe('new source form: repository reference', () => {
  it('adds and removes the repository reference', () => {
    const form = makeForm()

    form._handleFormData(formDataEvent('reporef-list', {data: ['repo-1']}))
    expect(form.data.reporef_list).toEqual([{_class: 'RepoRef', ref: 'repo-1'}])

    form._handleFormData(formDataEvent('reporef-list', {data: []}))
    expect(form.data.reporef_list).toEqual([])
  })

  it('stores call number and media type on the reference', () => {
    const form = makeForm()
    const mediaType = {_class: 'SourceMediaType', string: 'Book'}

    form._handleFormData(formDataEvent('reporef-list', {data: ['repo-1']}))
    form._handleFormData(formDataEvent('reporef-call-number', {data: 'A 12'}))
    form._handleFormData(formDataEvent('reporef-media-type', {data: mediaType}))

    expect(form.data.reporef_list).toEqual([
      {
        _class: 'RepoRef',
        ref: 'repo-1',
        call_number: 'A 12',
        media_type: mediaType,
      },
    ])
    expect(form.data).not.toHaveProperty('call_number')
    expect(form.data).not.toHaveProperty('media_type')
  })

  it('ignores call number without a repository', () => {
    const form = makeForm()

    form._handleFormData(formDataEvent('reporef-call-number', {data: 'A 12'}))

    expect(form.data.reporef_list).toEqual([])
  })

  it('resets to an empty source', () => {
    const form = makeForm()
    form._handleFormData(formDataEvent('reporef-list', {data: ['repo-1']}))
    form.isFormValid = true

    form._reset()

    expect(form.data).toEqual({_class: 'Source', reporef_list: []})
    expect(form.isValid).toBe(false)
  })
})

describe('object selector: new source', () => {
  const makeSelector = appState => {
    const element = document.createElement('grampsjs-form-select-object')
    element.objectType = 'source'
    element.allowNew = true
    element.appState = appState
    return element
  }

  it('offers creating a source only with add permission', () => {
    expect(makeSelector({permissions: {canAdd: true}})._canCreate()).toBe(true)
    expect(makeSelector({permissions: {canAdd: false}})._canCreate()).toBe(
      false
    )
  })

  it('posts the new source and selects it', async () => {
    const apiPost = vi.fn(async (url, payload) => ({
      data: [{new: {...payload, gramps_id: 'S0001'}}],
    }))
    const selector = makeSelector({apiPost, permissions: {canAdd: true}})
    // The save bails out when the selector was removed during the request.
    Object.defineProperty(selector, 'isConnected', {value: true})
    const changed = vi.fn()
    selector.addEventListener('select-object:changed', changed)
    selector._newObjectDialogOpen = true

    await selector._handleNewObjectSave({
      detail: {data: {_class: 'Source', title: 'Census 1900'}},
      preventDefault: () => {},
      stopPropagation: () => {},
    })

    const [url, payload] = apiPost.mock.calls[0]
    expect(url).toBe('/api/sources/')
    expect(payload).toMatchObject({_class: 'Source', title: 'Census 1900'})
    expect(selector._newObjectDialogOpen).toBe(false)
    expect(selector.objects).toEqual([
      {
        object_type: 'source',
        handle: payload.handle,
        object: {...payload, gramps_id: 'S0001'},
      },
    ])
    expect(changed).toHaveBeenCalledOnce()
  })
})

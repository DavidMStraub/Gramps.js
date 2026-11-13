import {describe, it, expect, vi} from 'vitest'
import '../../src/components/GrampsjsFormChildRef.js'

describe('privacy switch of a child link', () => {
  it('is left out where the dialog picks a person', () => {
    const form = document.createElement('grampsjs-form-childref')
    form.renderPrivate = vi.fn(() => '')
    form.noPrivate = true
    form.renderForm()
    expect(form.renderPrivate).not.toHaveBeenCalled()
    form.noPrivate = false
    form.renderForm()
    expect(form.renderPrivate).toHaveBeenCalled()
  })
})

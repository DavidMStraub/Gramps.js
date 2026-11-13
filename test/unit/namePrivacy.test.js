import {describe, it, expect, vi} from 'vitest'
import '../../src/components/GrampsjsFormEditName.js'

function nameForm(data) {
  const form = document.createElement('grampsjs-form-edit-name')
  form.data = data
  form.checkFormValidity = () => {}
  return form
}

// a formdata:changed event from the field with this id
function fieldEvent(id, detail) {
  return {
    composedPath: () => [{id}],
    detail,
    preventDefault() {},
    stopPropagation() {},
  }
}

describe('privacy of a name', () => {
  it('is set by the switch', () => {
    const form = nameForm({first_name: 'Anna', private: false})
    form._handleFormData(fieldEvent('private', {checked: true}))
    expect(form.data.private).to.equal(true)
  })

  it('has no switch on the primary name', () => {
    const form = nameForm({})
    form.renderPrivate = vi.fn(() => '')
    form.primary = true
    form.renderForm()
    expect(form.renderPrivate).not.toHaveBeenCalled()
    form.primary = false
    form.renderForm()
    expect(form.renderPrivate).toHaveBeenCalled()
  })
})

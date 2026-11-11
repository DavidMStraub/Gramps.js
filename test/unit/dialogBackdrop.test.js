import {describe, it, expect, afterEach} from 'vitest'
import {MdDialog} from '@material/web/dialog/dialog.js'
import '../../src/dialogBackdrop.js'

describe('dialog backdrop', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('adds the backdrop style to md-dialog', () => {
    const css = MdDialog.elementStyles.map(style => style.cssText).join('')
    expect(css).toContain('dialog::backdrop')
  })

  it('marks a dialog as closing until it has closed', async () => {
    const dialog = document.createElement('md-dialog')
    dialog.quick = true
    document.body.append(dialog)
    await dialog.updateComplete

    dialog.isOpening = true
    await dialog.animateDialog(dialog.getOpenAnimation())
    expect(dialog.hasAttribute('closing')).toBe(false)

    dialog.isOpening = false
    await dialog.animateDialog(dialog.getCloseAnimation())
    expect(dialog.hasAttribute('closing')).toBe(true)

    dialog.dispatchEvent(new Event('closed'))
    expect(dialog.hasAttribute('closing')).toBe(false)
  })

  it('clears the mark when the dialog opens again', async () => {
    const dialog = document.createElement('md-dialog')
    dialog.quick = true
    document.body.append(dialog)
    await dialog.updateComplete

    dialog.isOpening = false
    await dialog.animateDialog(dialog.getCloseAnimation())
    dialog.isOpening = true
    await dialog.animateDialog(dialog.getOpenAnimation())
    expect(dialog.hasAttribute('closing')).toBe(false)
  })
})

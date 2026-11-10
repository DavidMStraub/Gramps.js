/*
Tracks the open md-dialogs anywhere in the app.

md-dialog draws its scrim as a fixed element inside the page, so the scrim
cannot cover elements stacked above the page content, such as the sticky top
app bar. Its open and close events neither bubble nor leave its shadow root,
so every md-dialog reports changes of its open property here, and
`dialogs:changed` on window tells listeners which dialogs are open.
*/

import {MdDialog} from '@material/web/dialog/dialog.js'
import {fireEvent} from './util.js'

const openDialogs = new Set()

function update(dialog, isOpen) {
  const changed = isOpen ? !openDialogs.has(dialog) : openDialogs.has(dialog)
  if (!changed) {
    return
  }
  if (isOpen) {
    openDialogs.add(dialog)
  } else {
    openDialogs.delete(dialog)
  }
  // a dialog removed while open no longer counts
  const dialogs = [...openDialogs].filter(open => open.isConnected)
  fireEvent(window, 'dialogs:changed', {dialogs})
}

// The browser keeps the lifecycle callbacks it found when md-dialog was
// registered, but Lit looks up updated() on every update, and the open
// property changes when the dialog opens and closes, or an opening is
// cancelled
const {updated} = MdDialog.prototype

MdDialog.prototype.updated = function trackedUpdated(changed) {
  updated.call(this, changed)
  if (changed.has('open')) {
    update(this, this.open)
  }
}

// Whether `node` lies within `host`, across shadow roots
export function isInside(node, host) {
  let current = node
  while (current) {
    if (current === host) {
      return true
    }
    current = current.parentNode ?? current.host
  }
  return false
}

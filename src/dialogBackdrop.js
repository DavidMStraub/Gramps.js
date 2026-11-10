/*
Dims the page behind an open md-dialog with the browser's own backdrop.

md-dialog shows its dialog in the top layer but draws its scrim as a fixed
element inside the page, below anything stacked higher, such as the sticky
top app bar. The backdrop of the top layer covers the whole page, and goes
away with the dialog even when the dialog is removed while open.

The backdrop fades in and out like md-dialog's scrim. md-dialog keeps its
open property until its closing animation has finished, so the dialog
carries a `closing` attribute while that animation runs.
*/

import {css} from 'lit'
import {MdDialog} from '@material/web/dialog/dialog.js'

MdDialog.elementStyles.push(css`
  :host([open]) .scrim {
    display: none;
  }

  dialog::backdrop {
    background-color: var(--md-sys-color-scrim, #000);
    opacity: 0.32;
    /* the durations of md-dialog's scrim animations */
    animation: grampsjs-backdrop-in 500ms linear;
    transition: opacity 150ms linear;
  }

  :host([closing]) dialog::backdrop {
    opacity: 0;
  }

  :host([quick]) dialog::backdrop {
    animation: none;
    transition: none;
  }

  @keyframes grampsjs-backdrop-in {
    from {
      opacity: 0;
    }
  }
`)

const {animateDialog} = MdDialog.prototype

MdDialog.prototype.animateDialog = function trackedAnimateDialog(animation) {
  const closing = !this.isOpening
  this.toggleAttribute('closing', closing)
  if (closing) {
    this.addEventListener('closed', () => this.removeAttribute('closing'), {
      once: true,
    })
  }
  return animateDialog.call(this, animation)
}

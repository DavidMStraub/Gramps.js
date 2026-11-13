import {css, html, LitElement} from 'lit'
import {mdiOpenInNew} from '@mdi/js'
import '@material/web/button/text-button.js'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {docUrl} from '../docs.js'
import './GrampsjsIcon.js'

/**
 * A text button labelled `label` that opens the docs page at `path`, such as
 * 'administration/import/', in a new tab, in the user's language where the
 * docs have it. Meant for messages with a known fix, such as errors.
 */
export class GrampsjsDocButton extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: block;
          white-space: normal;
          /* the button's padding lines its label up with the text above */
          margin: 0.4em 0 -0.4em -12px;
        }
      `,
    ]
  }

  static get properties() {
    return {
      path: {type: String},
      label: {type: String},
    }
  }

  constructor() {
    super()
    this.path = ''
    this.label = ''
  }

  render() {
    return html`
      <md-text-button
        href="${docUrl(this.path, this.appState?.i18n?.lang)}"
        target="_blank"
        trailing-icon
      >
        ${this.label}
        <grampsjs-icon
          slot="icon"
          path="${mdiOpenInNew}"
          color="currentColor"
        ></grampsjs-icon>
      </md-text-button>
    `
  }
}

window.customElements.define('grampsjs-doc-button', GrampsjsDocButton)

import {css, html, LitElement} from 'lit'
import {mdiHelpCircleOutline} from '@mdi/js'
import '@material/web/iconbutton/icon-button.js'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {docUrl} from '../docs.js'
import './GrampsjsIcon.js'
import './GrampsjsTooltip.js'

/**
 * A help icon button that opens the docs page at `path`, such as
 * 'administration/import/', in a new tab, in the user's language where the
 * docs have it. Placed after a heading's text, it sits on the text line
 * without making the heading taller.
 */
export class GrampsjsHelpButton extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: inline-block;
          vertical-align: middle;
          /* the state layer extends beyond the line; negative margins keep
             it from adding height */
          margin: -8px 0 -8px 4px;
        }

        md-icon-button {
          --md-icon-button-state-layer-height: 32px;
          --md-icon-button-state-layer-width: 32px;
          --md-icon-button-icon-size: 20px;
          width: 32px;
          height: 32px;
        }
      `,
    ]
  }

  static get properties() {
    return {
      path: {type: String},
    }
  }

  constructor() {
    super()
    this.path = ''
  }

  render() {
    return html`
      <md-icon-button
        id="help-button"
        href="${docUrl(this.path, this.appState?.i18n?.lang)}"
        target="_blank"
        aria-label="${this._('Help')}"
      >
        <grampsjs-icon
          path="${mdiHelpCircleOutline}"
          color="var(--md-sys-color-on-surface-variant)"
        ></grampsjs-icon>
      </md-icon-button>
      <grampsjs-tooltip for="help-button" .appState="${this.appState}"
        >${this._('Help')}</grampsjs-tooltip
      >
    `
  }
}

window.customElements.define('grampsjs-help-button', GrampsjsHelpButton)

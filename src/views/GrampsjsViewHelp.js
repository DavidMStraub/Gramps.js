import {css, html} from 'lit'

import {mdiOpenInNew} from '@mdi/js'
import {GrampsjsView} from './GrampsjsView.js'
import {fireEvent} from '../util.js'
import '@material/web/button/filled-tonal-button.js'
import {docUrl} from '../docs.js'

export class GrampsjsViewHelp extends GrampsjsView {
  static get styles() {
    return [
      super.styles,
      css`
        .button-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5em;
        }
      `,
    ]
  }

  renderContent() {
    const {lang} = this.appState.i18n
    return html`
      <div>
        <h3>${this._('Documentation')}</h3>
        <div class="button-container">
          <md-filled-tonal-button
            href="${docUrl('user-guide', lang)}"
            target="_blank"
          >
            ${this._('User Documentation')}
            <grampsjs-icon
              .path="${mdiOpenInNew}"
              slot="icon"
              color="currentColor"
            ></grampsjs-icon>
          </md-filled-tonal-button>
          <md-filled-tonal-button
            href="${docUrl('administration/admin', lang)}"
            target="_blank"
          >
            ${this._('Administrator Documentation')}
            <grampsjs-icon
              .path="${mdiOpenInNew}"
              slot="icon"
              color="currentColor"
            ></grampsjs-icon>
          </md-filled-tonal-button>
        </div>
      </div>

      <div>
        <h3>${this._('Community')}</h3>
        <md-filled-tonal-button
          href="https://gramps.discourse.group/c/gramps-web"
          target="_blank"
        >
          ${this._('Forum')}
          <grampsjs-icon
            .path="${mdiOpenInNew}"
            slot="icon"
            color="currentColor"
          ></grampsjs-icon>
        </md-filled-tonal-button>
      </div>

      <div>
        <h3>${this._('Quick Access')}</h3>
        <md-filled-tonal-button
          @click="${() => fireEvent(this, 'shortcuts:show')}"
        >
          ${this._('Keyboard Shortcuts')}
        </md-filled-tonal-button>
      </div>
    `
  }
}

window.customElements.define('grampsjs-view-help', GrampsjsViewHelp)

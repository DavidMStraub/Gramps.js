/*
Form for adding a new event reference
*/

import {html, css} from 'lit'

import './GrampsjsFormSelectType.js'
import './GrampsjsFormSelectObjectList.js'
import './GrampsjsFormString.js'
import {GrampsjsObjectForm} from './GrampsjsObjectForm.js'

class GrampsjsFormEventRef extends GrampsjsObjectForm {
  static get styles() {
    return [
      ...super.styles,
      css`
        .private-hint {
          margin-top: 8px;
          color: var(--grampsjs-text-secondary-color);
        }
      `,
    ]
  }

  static get properties() {
    return {
      defaultRole: {type: String},
      // show a switch for the privacy of a participant's reference, with a
      // hint that it applies to the reference only
      showPrivate: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.defaultRole = 'Primary'
    this.showPrivate = false
  }

  renderForm() {
    return html`
      ${!this.new // select event shown only for new event ref
        ? ''
        : html`
            <grampsjs-form-select-object-list
              fixedMenuPosition
              style="min-height: 300px;"
              objectType="event"
              .appState="${this.appState}"
              id="event-select"
              label="${this._('Select')}"
              class="edit"
              .data="${this.data}"
            ></grampsjs-form-select-object-list>
          `}
      <grampsjs-form-select-type
        required
        id="event-role-type"
        defaultValue="${this.defaultRole}"
        heading="${this._('Role')}"
        .appState="${this.appState}"
        typeName="event_role_types"
        ?loadingTypes=${this.loadingTypes}
        .types="${this.types}"
        .typesLocale="${this.typesLocale}"
        value="${this.data?.role?.string || this.data?.role || ''}"
      >
      </grampsjs-form-select-type>
      ${this.showPrivate
        ? html`
            ${this.renderPrivate()}
            <p class="private-hint">
              ${this._("Applies only to this participant's link to the event.")}
            </p>
          `
        : ''}
    `
  }

  get isValid() {
    return !!this.data.ref
  }
}

window.customElements.define('grampsjs-form-eventref', GrampsjsFormEventRef)

import {LitElement, css, html} from 'lit'

import '@material/web/button/text-button'
import '@material/web/iconbutton/icon-button.js'
import {mdiPencil} from '@mdi/js'

import {sharedStyles, iconButtonColorStyles} from '../SharedStyles.js'
import './GrampsjsIcon.js'
import './GrampsjsTooltip.js'
import './GrampsjsSearchResultList.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import './GrampsjsFormSelectObject.js'

export class GrampsjsHomePerson extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      iconButtonColorStyles,
      css`
        h3 {
          margin-bottom: 15px;
        }

        /* the row is as wide as its text, so the edit button follows the
           name */
        .content {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .content grampsjs-search-result-list {
          flex: 0 1 auto;
          min-width: 0;
        }

        .content md-icon-button {
          flex: none;
          --grampsjs-icon-button-color: var(--grampsjs-text-secondary-color);
        }
      `,
    ]
  }

  static get properties() {
    return {
      homePersonDetails: {type: Object},
      homePersonMissing: {type: Boolean},
      homePersonGrampsId: {type: String},
    }
  }

  constructor() {
    super()
    this.homePersonDetails = {}
    this.homePersonMissing = false
    this.homePersonGrampsId = ''
  }

  render() {
    return html`
      <h3>${this._('Home Person')}</h3>

      ${this.homePersonGrampsId && !this.homePersonMissing
        ? html`
            <div class="content">
              <grampsjs-search-result-list
                large
                linked
                .appState="${this.appState}"
                ?loading="${!this.homePersonDetails?.handle}"
                numberLoading="1"
                .data=${[
                  {object: this.homePersonDetails, object_type: 'person'},
                ]}
              >
              </grampsjs-search-result-list>
              <md-icon-button
                id="btn-edit-home-person"
                aria-label="${this._('Set _Home Person')}"
                @click="${this._handleEditClick}"
              >
                <grampsjs-icon
                  path="${mdiPencil}"
                  color="currentColor"
                  height="20"
                  width="20"
                ></grampsjs-icon>
              </md-icon-button>
              <grampsjs-tooltip
                for="btn-edit-home-person"
                .appState="${this.appState}"
                >${this._('Set _Home Person')}</grampsjs-tooltip
              >
            </div>
          `
        : html` <md-text-button trailing-icon @click="${this._handleEditClick}">
            ${this._('Set _Home Person')}
            <svg viewBox="0 0 24 24" slot="icon">
              <path d="${mdiPencil}" />
            </svg>
          </md-text-button>`}
      <grampsjs-form-select-object
        @select-object:changed="${this._handleHomePerson}"
        objectType="person"
        .appState="${this.appState}"
        id="homeperson-select"
        label="${this._('Select')}"
        fixedMenuPosition
        hideButton
      ></grampsjs-form-select-object>
    `
  }

  _handleEditClick(e) {
    const anchor = e.detail?.sourceElement ?? e.currentTarget
    this.renderRoot.querySelector('#homeperson-select')?.open(anchor)
  }

  _handleHomePerson(e) {
    const obj = e.detail.objects[0]
    if (obj.object?.gramps_id) {
      this.appState.updateSettings({homePerson: obj.object.gramps_id}, true)
      this.homePersonDetails = obj.object
    }
    e.preventDefault()
    e.stopPropagation()
  }
}

window.customElements.define('grampsjs-home-person', GrampsjsHomePerson)

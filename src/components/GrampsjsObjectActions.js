/*
The toolbar of an object page: its privacy, a bookmark button and a share
button
*/

import {LitElement, html, css} from 'lit'

import {mdiLockOpenVariantOutline, mdiLock} from '@mdi/js'

import {sharedStyles} from '../SharedStyles.js'
import {fireEvent, clickKeyHandler} from '../util.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import './GrampsjsIcon.js'
import './GrampsjsTooltip.js'
import './GrampsjsShareUrl.js'
import './GrampsjsBookmarkButton.js'

export class GrampsjsObjectActions extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          color: var(--grampsjs-text-secondary-color);
        }

        #privacy-status {
          display: inline-flex;
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
        }

        md-icon-button,
        grampsjs-share-url,
        grampsjs-bookmark-button {
          --md-icon-button-icon-size: 18px;
          --md-icon-button-state-layer-width: 36px;
          --md-icon-button-state-layer-height: 36px;
          --md-icon-button-disabled-icon-opacity: 1;
        }

        md-icon-button {
          width: 36px;
          height: 36px;
        }
      `,
    ]
  }

  static get properties() {
    return {
      data: {type: Object},
      edit: {type: Boolean},
      objectEndpoint: {type: String},
      hideBookmark: {type: Boolean},
      hideLock: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.data = {}
    this.edit = false
    this.objectEndpoint = ''
    this.hideBookmark = false
    this.hideLock = false
  }

  render() {
    return html`
      ${this._renderPrivacy()}
      ${this.hideBookmark
        ? ''
        : html`
            <grampsjs-bookmark-button
              .appState="${this.appState}"
              handle="${this.data.handle}"
              endpoint="${this.objectEndpoint}"
            ></grampsjs-bookmark-button>
          `}
      <grampsjs-share-url
        href="${document.URL}"
        .appState="${this.appState}"
      ></grampsjs-share-url>
    `
  }

  // A button that toggles the privacy while editing, otherwise an icon that
  // shows it
  _renderPrivacy() {
    if (this.hideLock) {
      return ''
    }
    const label = this.data.private
      ? this._('Record is private')
      : this._('Record is public')
    const path = this.data.private ? mdiLock : mdiLockOpenVariantOutline
    if (this.edit) {
      return html`
        <span id="wrap-btn-private">
          <md-icon-button
            @click="${this._handlePrivacyClick}"
            @keydown="${clickKeyHandler}"
            touch-target="none"
            id="btn-private"
            aria-label="${label}"
          >
            <grampsjs-icon
              .path="${path}"
              color="var(--mdc-theme-secondary)"
            ></grampsjs-icon>
          </md-icon-button>
          <grampsjs-tooltip
            for="wrap-btn-private"
            content="${label}"
          ></grampsjs-tooltip>
        </span>
      `
    }
    return html`
      <span id="privacy-status" role="img" aria-label="${label}">
        <grampsjs-icon
          .path="${path}"
          color="currentColor"
          height="18"
          width="18"
        ></grampsjs-icon>
        <grampsjs-tooltip
          for="privacy-status"
          content="${label}"
        ></grampsjs-tooltip>
      </span>
    `
  }

  _handlePrivacyClick() {
    fireEvent(this, 'edit:action', {
      action: 'updateProp',
      data: {private: !this.data.private},
    })
  }
}

window.customElements.define('grampsjs-object-actions', GrampsjsObjectActions)

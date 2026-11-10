/*
The navigation drawer: a column next to the content that is either expanded
or collapsed to an icon rail, or, on small screens, a modal sheet
*/

import {html, css, LitElement} from 'lit'
import '@material/web/iconbutton/icon-button.js'
import {mdiMenu} from '@mdi/js'

import {sharedStyles, appBarIconButtonStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {fireEvent} from '../util.js'
import {getTreeName} from '../api.js'
import './GrampsjsIcon.js'
import './GrampsjsMainMenu.js'

export const DRAWER_EXPANDED = 'expanded'
export const DRAWER_RAIL = 'rail'
export const DRAWER_MODAL = 'modal'

class GrampsjsNavDrawer extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      appBarIconButtonStyles,
      css`
        :host {
          display: block;
          position: sticky;
          top: 0;
          align-self: start;
          height: 100dvh;
          color: var(--md-sys-color-on-surface-variant);
        }

        :host([mode='modal']) {
          position: static;
          height: 0;
        }

        .panel {
          box-sizing: border-box;
          width: var(--grampsjs-drawer-width, 256px);
          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          background-color: var(--grampsjs-drawer-background-color);
        }

        :host([mode='rail']) .panel {
          width: var(--grampsjs-rail-width, 72px);
        }

        .panel,
        .sheet {
          display: flex;
          flex-direction: column;
        }

        grampsjs-main-menu {
          flex: 1 0 auto;
        }

        /* the menu button lines up with the menu's icons below it */
        .header {
          display: flex;
          align-items: center;
          gap: 8px;
          height: var(--grampsjs-app-bar-height, 64px);
          padding: 0 12px 0 16px;
          box-sizing: border-box;
          flex: none;
        }

        /* starts in line with the menu's labels */
        .tree-name {
          min-width: 0;
          font-family: var(--grampsjs-heading-font-family);
          font-size: 14px;
          font-weight: var(--grampsjs-font-weight-heading);
          line-height: 17px;
          color: var(--md-sys-color-on-surface);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          overflow-wrap: anywhere;
        }

        dialog {
          margin: 0;
          padding: 0;
          border: none;
          width: 280px;
          max-width: calc(100vw - 56px);
          height: 100dvh;
          max-height: 100dvh;
          background-color: var(--grampsjs-drawer-background-color);
          color: inherit;
          border-radius: 0 16px 16px 0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          overflow-y: auto;
        }

        dialog[open] {
          animation: slide-in 200ms ease-out;
        }

        dialog::backdrop {
          background-color: rgba(0, 0, 0, 0.32);
        }

        .sheet {
          min-height: 100%;
        }

        @keyframes slide-in {
          from {
            transform: translateX(-100%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          dialog[open] {
            animation: none;
          }
        }
      `,
    ]
  }

  static get properties() {
    return {
      mode: {type: String, reflect: true},
      open: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.mode = DRAWER_EXPANDED
    this.open = false
  }

  render() {
    const rail = this.mode === DRAWER_RAIL
    const treeName = getTreeName(this.appState) || 'Gramps Web'
    const content = html`
      <div class="header">
        <md-icon-button
          aria-label="${this._('Menu')}"
          @click="${this._handleToggle}"
        >
          <grampsjs-icon path="${mdiMenu}" color="currentColor"></grampsjs-icon>
        </md-icon-button>
        ${rail
          ? ''
          : html`<span class="tree-name" title="${treeName}"
              >${treeName}</span
            >`}
      </div>
      <grampsjs-main-menu
        .appState="${this.appState}"
        ?rail="${rail}"
      ></grampsjs-main-menu>
    `
    if (this.mode === DRAWER_MODAL) {
      // the backdrop click has Escape as its keyboard equivalent, which the
      // dialog handles itself
      /* eslint-disable lit-a11y/click-events-have-key-events */
      return html`
        <dialog
          @click="${this._handleDialogClick}"
          @close="${this._handleDialogClose}"
        >
          <div class="sheet">${content}</div>
        </dialog>
      `
      /* eslint-enable lit-a11y/click-events-have-key-events */
    }
    return html`<div class="panel">${content}</div>`
  }

  updated() {
    const dialog = this.renderRoot.querySelector('dialog')
    if (!dialog) return
    if (this.open && !dialog.open) {
      dialog.showModal()
    } else if (!this.open && dialog.open) {
      dialog.close()
    }
  }

  _handleToggle() {
    fireEvent(this, 'drawer:toggle')
  }

  // a click on the dialog element itself is a click on the backdrop, since
  // the sheet fills the whole dialog box
  _handleDialogClick(e) {
    if (e.target === e.currentTarget) {
      e.currentTarget.close()
    }
  }

  // closed by Escape, a backdrop click, or the open property
  _handleDialogClose() {
    if (this.open) {
      fireEvent(this, 'drawer:close')
    }
  }
}

window.customElements.define('grampsjs-nav-drawer', GrampsjsNavDrawer)

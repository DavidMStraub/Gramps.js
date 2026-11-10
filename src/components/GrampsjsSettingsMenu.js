/*
The account menu in the top app bar, with settings, help, and logging out
*/

import {html, css, LitElement} from 'lit'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/icon/icon'
import '@material/web/menu/menu'
import '@material/web/menu/menu-item'
import '@material/web/divider/divider.js'

import {
  mdiLogout,
  mdiInformationOutline,
  mdiWrenchOutline,
  mdiAccountMultipleOutline,
  mdiAccountCogOutline,
  mdiAccountCircleOutline,
  mdiHelpCircleOutline,
  mdiCloudOutline,
  mdiOpenInNew,
} from '@mdi/js'
import {sharedStyles, appBarIconButtonStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import './GrampsjsIcon.js'
import {clickKeyHandler} from '../util.js'

const menuItems = [
  ['User settings', '/settings/user', mdiAccountCogOutline, false],
  ['Administration', '/settings/administration', mdiWrenchOutline, true],
  ['Manage users', '/settings/users', mdiAccountMultipleOutline, true],
  ['System Information', '/settings/info', mdiInformationOutline, false],
  ['Help', '/help', mdiHelpCircleOutline, false],
]

class GrampsjsSettingsMenu extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      appBarIconButtonStyles,
      css`
        /* a faint line between the groups of items */
        md-divider {
          --md-divider-thickness: 1px;
          --md-divider-color: var(--grampsjs-divider-color);
          margin: 4px 0;
        }

        /* md-menu-item keeps 16px between icon and text; 12px is enough
           for the smaller icons */
        md-menu-item [slot='start'] {
          margin-inline-end: -4px;
        }

        md-menu-item {
          --icon-color: color-mix(
            in srgb,
            var(--grampsjs-text-secondary-color) 80%,
            transparent
          );
        }
        md-menu-item.red {
          --md-menu-item-label-text-color: var(--grampsjs-logout-font-color);
          --icon-color: var(--grampsjs-logout-font-color);
        }
      `,
    ]
  }

  render() {
    return html`
      <div style="position: relative;">
        <md-icon-button
          aria-label="${this._('Settings')}"
          @click="${this._handleClickSettings}"
          id="button_settings"
        >
          <grampsjs-icon
            path="${mdiAccountCircleOutline}"
            color="currentColor"
          ></grampsjs-icon>
        </md-icon-button>

        <md-menu
          id="menu_settings"
          anchor="button_settings"
          anchor-corner="start-end"
          menu-corner="end-end"
        >
          ${menuItems.map(menuItem => this._menuItem(...menuItem))}
          ${this._renderAccountItem()}
          <md-divider inset role="separator" tabindex="-1"></md-divider>
          <md-menu-item
            class="red"
            @click="${() => this.appState.signout()}"
            @keydown="${clickKeyHandler}"
          >
            <div slot="headline">${this._('Log out')}</div>
            <grampsjs-icon
              slot="start"
              path="${mdiLogout}"
              color="var(--icon-color)"
              height="20"
              width="20"
            ></grampsjs-icon>
          </md-menu-item>
        </md-menu>
      </div>
    `
  }

  // Link to the page where the provider hosting this instance lets owners manage
  // it, set via `accountUrl` and `accountName` in config.js. The label is the
  // provider's name, a proper noun, so it needs no translation. Shown to tree
  // owners only, since nobody else can act on what it leads to.
  _renderAccountItem() {
    const {accountUrl, accountName} = this.appState.frontendConfig
    if (
      !accountUrl ||
      !accountName ||
      !this.appState.permissions.canManageUsers
    ) {
      return ''
    }
    return html`
      <md-divider inset role="separator" tabindex="-1"></md-divider>
      <md-menu-item href="${accountUrl}" target="_blank">
        <div slot="headline">${accountName}</div>
        <grampsjs-icon
          slot="start"
          path="${mdiCloudOutline}"
          color="var(--icon-color)"
          height="20"
          width="20"
        ></grampsjs-icon>
        <grampsjs-icon
          slot="end"
          path="${mdiOpenInNew}"
          color="var(--icon-color)"
          height="18"
          width="18"
        ></grampsjs-icon>
      </md-menu-item>
    `
  }

  _menuItem(title, url, icon, needsAdminPermission) {
    if (needsAdminPermission && !this.appState.permissions.canManageUsers) {
      return ''
    }
    return html`
      <md-menu-item href="${url}">
        <div slot="headline">${this._(title)}</div>
        <grampsjs-icon
          slot="start"
          path="${icon}"
          color="var(--icon-color)"
          height="20"
          width="20"
        ></grampsjs-icon>
      </md-menu-item>
    `
  }

  _handleClickSettings() {
    const menu = this.shadowRoot.getElementById('menu_settings')
    menu.open = !menu.open
  }
}

window.customElements.define('grampsjs-settings-menu', GrampsjsSettingsMenu)

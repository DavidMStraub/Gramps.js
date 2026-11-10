/*
The dropdown menu for adding objects in the top app bar, a labelled button or,
on small screens, an icon button
*/

import {html, css, LitElement} from 'lit'
import {
  mdiAccount,
  mdiAccountMultiple,
  mdiCalendar,
  mdiMapMarker,
  mdiBookOpenVariant,
  mdiBookmark,
  mdiArchive,
  mdiTextBox,
  mdiImage,
  mdiFormatListChecks,
  mdiMenuDown,
  mdiPlus,
  mdiRss,
} from '@mdi/js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/button/filled-button.js'
import '@material/web/menu/menu'
import '@material/web/menu/menu-item'

import {sharedStyles, appBarIconButtonStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import './GrampsjsIcon.js'
import './GrampsjsTooltip.js'

const menuItems = [
  ['Person', '/new_person', mdiAccount],
  ['Family', '/new_family', mdiAccountMultiple],
  ['Event', '/new_event', mdiCalendar],
  ['Place', '/new_place', mdiMapMarker],
  ['Source', '/new_source', mdiBookOpenVariant],
  ['Citation', '/new_citation', mdiBookmark],
  ['Repository', '/new_repository', mdiArchive],
  ['Note', '/new_note', mdiTextBox],
  ['Media Object', '/new_media', mdiImage],
  ['Task', '/new_task', mdiFormatListChecks],
  ['Blog Post', '/new_blog_post', mdiRss],
]

class GrampsjsAddMenu extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      appBarIconButtonStyles,
      css`
        md-filled-button {
          margin: 0 4px;
          --md-filled-button-leading-space: 16px;
          --md-filled-button-trailing-space: 12px;
        }

        /* a small label above the items */
        md-menu-item.header {
          --md-menu-item-disabled-opacity: 1;
          --md-menu-item-label-text-color: var(--grampsjs-text-secondary-color);
          --md-menu-item-one-line-container-height: 32px;
          --md-menu-item-label-text-size: 13px;
        }
      `,
    ]
  }

  static get properties() {
    return {
      labelled: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.labelled = false
  }

  render() {
    return html`
      <div style="position: relative;">
        ${this.labelled
          ? this._renderLabelledButton()
          : this._renderIconButton()}

        <md-menu
          id="menu_add"
          anchor="button_add"
          anchor-corner="start-end"
          menu-corner="end-end"
        >
          <md-menu-item disabled class="header"
            ><div slot="headline">${this._('Add')}</div></md-menu-item
          >
          ${menuItems.map(menuItem => this._menuItem(...menuItem))}
        </md-menu>
      </div>
    `
  }

  _renderLabelledButton() {
    return html`<md-filled-button
      id="button_add"
      has-icon
      trailing-icon
      @click="${this._handleClickAdd}"
    >
      ${this._('Add')}
      <grampsjs-icon
        slot="icon"
        path="${mdiMenuDown}"
        color="currentColor"
      ></grampsjs-icon>
    </md-filled-button>`
  }

  _renderIconButton() {
    return html`<md-icon-button
        aria-label="${this._('Add')}"
        @click="${this._handleClickAdd}"
        id="button_add"
      >
        <grampsjs-icon path="${mdiPlus}" color="currentColor"></grampsjs-icon>
      </md-icon-button>
      <grampsjs-tooltip for="button_add" .appState="${this.appState}"
        >${this._('Add')}</grampsjs-tooltip
      >`
  }

  _menuItem(title, url, iconPath) {
    return html`
      <md-menu-item href="${url}" graphic="icon">
        <span slot="headline">${this._(title)}</span>
        <grampsjs-icon
          slot="start"
          path="${iconPath}"
          color="var(--grampsjs-body-font-color-35)"
        ></grampsjs-icon>
      </md-menu-item>
    `
  }

  _handleClickAdd() {
    const menu = this.shadowRoot.getElementById('menu_add')
    menu.open = !menu.open
  }
}

window.customElements.define('grampsjs-add-menu', GrampsjsAddMenu)

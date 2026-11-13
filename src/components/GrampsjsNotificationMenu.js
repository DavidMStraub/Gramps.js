/*
The notification bell in the top app bar. It opens a menu with the running
tasks and the latest notifications, and links to the notifications page,
which small screens open directly.
*/

import {html, css, LitElement} from 'lit'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/menu/menu'
import '@material/web/menu/menu-item'
import '@material/web/divider/divider.js'
import {
  mdiBellOutline,
  mdiBellBadgeOutline,
  mdiChevronRight,
  mdiDownload,
} from '@mdi/js'

import {sharedStyles, appBarIconButtonStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {downloadExportFile} from '../api.js'
import {clickKeyHandler, fireEvent} from '../util.js'
import {
  notificationDownloadFileName,
  notificationDownloadUrl,
  notificationHasDetail,
  notificationHref,
  renderNotificationContent,
  runningTasks,
} from '../notifications.js'
import './GrampsjsIcon.js'
import './GrampsjsTaskProgressIndicator.js'
import './GrampsjsTimedelta.js'

// The number of notifications the menu shows; the page shows all of them.
export const MENU_NOTIFICATION_COUNT = 10

class GrampsjsNotificationMenu extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      appBarIconButtonStyles,
      css`
        .anchor {
          position: relative;
        }

        .badge {
          position: absolute;
          top: 6px;
          right: 4px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 9px;
          box-sizing: border-box;
          background-color: var(--md-sys-color-error);
          color: var(--md-sys-color-on-error);
          font-size: 11px;
          font-weight: 700;
          line-height: 18px;
          text-align: center;
          pointer-events: none;
        }

        md-menu {
          --md-menu-item-supporting-text-color: var(
            --grampsjs-body-font-color-60
          );
        }

        md-menu-item {
          width: min(360px, calc(100vw - 32px));
          --md-menu-item-top-space: 10px;
          --md-menu-item-bottom-space: 10px;
        }

        md-menu-item [slot='headline'] {
          white-space: normal;
        }

        md-menu-item.unread [slot='headline'] {
          font-weight: var(--grampsjs-font-weight-medium);
        }

        md-divider {
          --md-divider-thickness: 1px;
          --md-divider-color: var(--grampsjs-divider-color);
          margin: 4px 0;
        }

        .empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: min(360px, calc(100vw - 32px));
          padding: 24px 16px;
          box-sizing: border-box;
          color: var(--grampsjs-text-secondary-color);
        }

        .empty p {
          margin: 0;
        }
      `,
    ]
  }

  static get properties() {
    return {
      _notifications: {state: true},
      _activeTasks: {state: true},
      _unreadCount: {state: true},
      _unreadIds: {state: true},
    }
  }

  constructor() {
    super()
    this._notifications = []
    this._activeTasks = []
    this._unreadCount = 0
    // the notifications that were unread when the menu opened
    this._unreadIds = new Set()
    this._handleNotificationsChanged =
      this._handleNotificationsChanged.bind(this)
    this._handleTasksChanged = this._handleTasksChanged.bind(this)
  }

  render() {
    return html`
      <div class="anchor">
        <md-icon-button
          id="button_notifications"
          aria-label="${this._('Notifications')}"
          @click="${this._handleClickBell}"
        >
          <grampsjs-icon
            path="${this._unreadCount > 0
              ? mdiBellBadgeOutline
              : mdiBellOutline}"
            color="currentColor"
          ></grampsjs-icon>
        </md-icon-button>
        ${this._unreadCount > 0
          ? html`<span class="badge">${this._unreadCount}</span>`
          : ''}
        <md-menu
          id="menu_notifications"
          anchor="button_notifications"
          anchor-corner="start-end"
          menu-corner="end-end"
          @opening="${this._handleOpening}"
        >
          ${this._renderTasks()} ${this._renderNotifications()}
          <md-divider role="separator" tabindex="-1"></md-divider>
          <md-menu-item href="/notifications">
            <div slot="headline">${this._('Show all')}</div>
            <grampsjs-icon
              slot="end"
              path="${mdiChevronRight}"
              color="var(--grampsjs-body-font-color-60)"
              height="20"
              width="20"
            ></grampsjs-icon>
          </md-menu-item>
        </md-menu>
        <a
          id="downloadanchor"
          aria-hidden="true"
          href="#"
          style="display:none"
          download
        ></a>
      </div>
    `
  }

  _renderTasks() {
    return runningTasks(this._activeTasks).map(
      task => html`
        <md-menu-item keep-open>
          <grampsjs-task-progress-indicator
            slot="start"
            taskId="${task.id}"
            taskName="${task.taskName}"
            size="24"
            hideAfter="0"
            ?open="${true}"
            .appState="${this.appState}"
          ></grampsjs-task-progress-indicator>
          <div slot="headline">${this._(task.label)}</div>
          <div slot="supporting-text">
            <grampsjs-timedelta
              timestamp="${task.createdAt}"
              locale="${this.appState?.i18n?.lang || 'en'}"
            ></grampsjs-timedelta>
            ${task.userName ? html` &middot; ${task.userName}` : ''}
          </div>
        </md-menu-item>
      `
    )
  }

  _renderNotifications() {
    if (
      this._notifications.length === 0 &&
      runningTasks(this._activeTasks).length === 0
    ) {
      return html`<div class="empty">
        <grampsjs-icon
          path="${mdiBellOutline}"
          color="var(--grampsjs-text-secondary-color)"
          height="32"
          width="32"
        ></grampsjs-icon>
        <p>${this._('No notifications')}</p>
      </div>`
    }
    return this._notifications
      .slice(0, MENU_NOTIFICATION_COUNT)
      .map(n => this._renderNotification(n))
  }

  _renderNotification(n) {
    const downloadUrl = notificationDownloadUrl(n)
    return html`
      <md-menu-item
        class="${this._unreadIds.has(n.id) ? 'unread' : ''}"
        href="${this._itemHref(n)}"
        @click="${downloadUrl ? () => this._download(n) : null}"
        @keydown="${downloadUrl ? clickKeyHandler : null}"
      >
        ${renderNotificationContent(
          n,
          (...a) => this._(...a),
          this.appState?.i18n?.lang
        )}
        ${downloadUrl
          ? html`<grampsjs-icon
              slot="end"
              path="${mdiDownload}"
              color="var(--grampsjs-body-font-color-60)"
              height="20"
              width="20"
              title="${this._('Download')}"
            ></grampsjs-icon>`
          : ''}
      </md-menu-item>
    `
  }

  // A change by another user leads to its revision. A finished export is
  // downloaded on click. Other entries with details lead to the
  // notifications page, which shows them.
  // eslint-disable-next-line class-methods-use-this
  _itemHref(n) {
    const href = notificationHref(n)
    if (href) return href
    if (notificationDownloadUrl(n)) return ''
    return notificationHasDetail(n) ? '/notifications' : ''
  }

  _download(n) {
    return downloadExportFile(
      this.appState,
      this.renderRoot.querySelector('#downloadanchor'),
      notificationDownloadUrl(n),
      notificationDownloadFileName(n)
    )
  }

  _handleClickBell() {
    if (this.appState.screenSize === 'small') {
      fireEvent(this, 'nav', {path: 'notifications'})
      return
    }
    const menu = this.renderRoot.querySelector('#menu_notifications')
    menu.open = !menu.open
  }

  // Opening the menu marks everything read; the entries that were unread
  // stay highlighted while it is open.
  _handleOpening() {
    const notifications = this.appState?.getNotifications?.() ?? []
    this._unreadIds = new Set(
      notifications.filter(n => n.read === false).map(n => n.id)
    )
    this.appState?.markAllRead?.()
    // Refresh from server so cross-device / post-reload tasks are visible.
    this.appState?.loadActiveTasks?.()
  }

  _handleNotificationsChanged(e) {
    this._notifications = [...e.detail.notifications]
    this._unreadCount = e.detail.unreadCount
  }

  _handleTasksChanged(e) {
    this._activeTasks = [...e.detail.tasks]
  }

  connectedCallback() {
    super.connectedCallback()
    this._notifications = this.appState?.getNotifications?.() ?? []
    this._activeTasks = this.appState?.getActiveTasks?.() ?? []
    this._unreadCount = this._notifications.filter(
      n => n?.read === false
    ).length
    window.addEventListener(
      'notifications:changed',
      this._handleNotificationsChanged
    )
    window.addEventListener('tasks:changed', this._handleTasksChanged)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener(
      'notifications:changed',
      this._handleNotificationsChanged
    )
    window.removeEventListener('tasks:changed', this._handleTasksChanged)
  }
}

window.customElements.define(
  'grampsjs-notification-menu',
  GrampsjsNotificationMenu
)

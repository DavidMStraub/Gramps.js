/*
How notification log entries are shown, shared by the notification menu in
the app bar and the notifications page. Functions that show text take the
translation function `_` of the calling element.
*/

import {html} from 'lit'
import {
  mdiAlertCircleOutline,
  mdiCheckCircleOutline,
  mdiInformationOutline,
  mdiAlertOutline,
} from '@mdi/js'

import {isExportDownloadUrl} from './api.js'
import './components/GrampsjsIcon.js'
import './components/GrampsjsTimedelta.js'

const TYPE_ICON = {
  error: mdiAlertCircleOutline,
  warning: mdiAlertOutline,
  info: mdiInformationOutline,
  success: mdiCheckCircleOutline,
}

const TYPE_COLOR = {
  error: 'var(--md-sys-color-error)',
  warning: 'var(--md-sys-color-tertiary)',
  info: 'var(--md-sys-color-primary)',
  success: 'var(--grampsjs-alert-success-font-color)',
}

const TERMINAL_TASK_STATES = new Set(['SUCCESS', 'FAILURE', 'REVOKED'])

export function notificationIcon(n) {
  return TYPE_ICON[n.type] ?? TYPE_ICON.info
}

export function notificationColor(n) {
  return TYPE_COLOR[n.type] ?? TYPE_COLOR.info
}

// The tasks that have not finished yet.
export function runningTasks(tasks) {
  return tasks.filter(t => !TERMINAL_TASK_STATES.has(t.state))
}

// The file URL of a finished export or media archive, else ''.
export function notificationDownloadUrl(n) {
  if (n?.source !== 'task' || n.type !== 'success') {
    return ''
  }
  const url = n.detail?.url
  return isExportDownloadUrl(url) ? url : ''
}

// Matches the file names the Export page uses.
export function notificationDownloadFileName(n) {
  const {url, file_type: fileType, file_name: fileName} = n.detail
  if (url.startsWith('/api/media/archive/')) {
    return 'grampsweb-media-export.zip'
  }
  if (typeof fileType === 'string' && fileType) {
    return `grampsweb-export${fileType}`
  }
  return fileName || ''
}

export function notificationHasDetail(n) {
  return Boolean(n.detail) && Object.keys(n.detail).length > 0
}

// A change by another user links to its revision, several changes link to
// the list of revisions.
export function notificationHref(n) {
  if (n.source !== 'history') return ''
  const id = n.detail?.transactionId
  return id != null ? `/revision/${id}` : '/revisions'
}

// Task labels and transaction descriptions are translatable strings.
export function notificationMessage(n, _) {
  if (n.source === 'history' && n.detail?.count > 1) {
    return _('%s changes', n.detail.count)
  }
  return ['task', 'history'].includes(n.source) ? _(n.message) : n.message
}

// Finished tasks state their outcome; other entries name their source.
export function notificationSourceLabel(n, _) {
  if (n.source === 'task' && n.type === 'success') {
    return _('Task completed')
  }
  if (n.source === 'task' && n.type === 'error') {
    return _('Task failed')
  }
  const labels = {
    api: _('Network'),
    task: _('Task'),
    save: _('_Save'),
    browser: _('Browser'),
    history: _('Revisions'),
  }
  return labels[n.source] ?? n.source
}

// The error message of a failed task, shown in place of the raw details
// (which stay available via Copy JSON). Empty when the failure carries no
// plain-text message.
export function notificationFailureMessage(n) {
  if (n.source !== 'task' || n.type !== 'error') {
    return ''
  }
  const {info, result_object: resultObject} = n.detail ?? {}
  const errorMessage = resultObject?.error?.message
  if (typeof errorMessage === 'string' && errorMessage) {
    return errorMessage
  }
  if (typeof info === 'string' && info) {
    return info
  }
  return typeof resultObject === 'string' ? resultObject : ''
}

// The content of an entry's row, for a list item or a menu item: the icon,
// the message, and its source, age and user.
export function renderNotificationContent(n, _, lang) {
  return html`
    <grampsjs-icon
      slot="start"
      path="${notificationIcon(n)}"
      color="${notificationColor(n)}"
      height="20"
      width="20"
    ></grampsjs-icon>
    <div slot="headline">${notificationMessage(n, _)}</div>
    <div slot="supporting-text">
      ${notificationSourceLabel(n, _)} &middot;
      <grampsjs-timedelta
        timestamp="${n.timestamp.getTime() / 1000}"
        locale="${lang || 'en'}"
      ></grampsjs-timedelta>
      ${n.userName ? html` &middot; ${n.userName}` : ''}
    </div>
  `
}

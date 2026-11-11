/*
The list of tasks with its filters and bulk actions
*/

import {html, css, LitElement, nothing} from 'lit'
import {classMap} from 'lit/directives/class-map.js'
import {mdiSort} from '@mdi/js'

import '@material/web/checkbox/checkbox'
import '@material/web/iconbutton/icon-button'
import '@material/web/button/outlined-button'
import '@material/web/menu/menu'
import '@material/web/menu/menu-item'
import '@material/web/select/filled-select'
import '@material/web/select/select-option'

import './GrampsjsFilters.js'
import './GrampsjsTagChips.js'
import './GrampsjsIcon.js'
import './GrampsjsTooltip.js'
import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {fireEvent} from '../util.js'
import {tagFilter, textFilter} from '../filterDefinitions.js'
import {
  PRIORITY_ICONS,
  TASK_PRIORITIES,
  TASK_SORT_ORDERS,
  TASK_STATUSES,
  filterTasks,
  priorityLabel,
  sortTasks,
  statusIcon,
  taskAttribute,
  taskPriorityFilter,
  taskStatusFilter,
} from '../taskConstants.js'

class GrampsjsTasks extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        .tasks-list {
          font-size: 15px;
          margin-top: 20px;
          margin-bottom: 85px;
        }

        .task-item + .task-item {
          border-top: 1px solid var(--grampsjs-divider-color);
        }

        .task-item {
          display: flex;
          align-items: center;
          width: 100%;
          box-sizing: border-box;
          padding-left: 10px;
          gap: 8px;
        }

        .task-item {
          cursor: pointer;
        }

        .task-item:hover {
          background-color: var(--grampsjs-color-shade-240);
        }

        .task-item.selected {
          background-color: var(
            --md-sys-color-secondary-container,
            var(--grampsjs-color-shade-240)
          );
        }

        .task-item md-checkbox {
          flex-shrink: 0;
        }

        a.title-link {
          color: var(--mdc-theme-text-primary-on-background);
        }

        .task-item:hover a.title-link,
        a.title-link:focus-visible {
          color: var(--grampsjs-color-link-hover);
          text-decoration: none;
        }

        .item-content {
          padding: 14px 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
        }

        .status-icon {
          width: 32px;
          display: flex;
          align-items: center;
        }

        .status-icon > grampsjs-icon {
          margin-right: 12px;
        }

        /* the icon stays where it is without the button, and the button
        doesn't make the row taller */
        .status-icon md-icon-button {
          --md-icon-button-icon-size: 20px;
          margin: -10px 0 -10px -10px;
        }

        .title {
          white-space: normal;
          overflow-wrap: break-word;
          height: 100%;
          width: 100%;
          padding-right: 8px;
          flex: auto;
          word-wrap: break-word;
          hyphens: auto;
        }

        .strike {
          text-decoration: line-through !important;
        }

        .batch-toolbar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px 24px;
          /* the select-all checkbox lines up with the checkboxes of the rows */
          padding: 6px 4px 6px 10px;
          margin-top: 8px;
        }

        .batch-toolbar .selection-count {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          color: var(--grampsjs-text-secondary-color);
        }

        .batch-actions {
          display: flex;
          gap: 8px;
        }

        .menu-anchor {
          position: relative;
          display: inline-block;
        }

        md-checkbox {
          --md-sys-color-primary: var(--md-sys-color-secondary);
          --md-sys-color-on-primary: var(--md-sys-color-on-secondary);
        }

        .prio-icon grampsjs-icon {
          padding-left: 8px;
          position: relative;
          top: 2px;
        }

        grampsjs-tag-chips {
          margin-left: 1em;
        }

        .task-meta {
          padding-right: 8px;
        }

        .sort-control md-filled-select {
          min-width: 180px;
          --md-filled-select-text-field-container-color: transparent;
          --md-filled-select-text-field-container-height: 40px;
          --md-filled-select-text-field-top-space: 0px;
          --md-filled-select-text-field-bottom-space: 0px;
        }

        .empty {
          margin-top: 32px;
          color: var(--grampsjs-text-secondary-color);
        }
      `,
    ]
  }

  static get properties() {
    return {
      data: {type: Array},
      loading: {type: Boolean},
      _selectedHandles: {type: Array},
      _statusMenuTask: {type: Object},
      // rules of the status and priority filters
      _localFilters: {type: Array},
      // a key of TASK_SORT_ORDERS
      _sortKey: {type: String},
    }
  }

  constructor() {
    super()
    this.data = []
    this.loading = false
    this._selectedHandles = []
    // the task whose status icon opened the status menu
    this._statusMenuTask = null
    this._localFilters = []
    this._sortKey = 'status'
    // the filtered and sorted tasks
    this._tasks = []
  }

  get _canEdit() {
    return this.appState?.permissions?.canEdit
  }

  // Selected tasks that are no longer listed, e.g. after a filter change or
  // a reload, are deselected
  willUpdate(changed) {
    if (['data', '_localFilters', '_sortKey'].some(prop => changed.has(prop))) {
      this._tasks = sortTasks(
        filterTasks(this.data, this._localFilters),
        this._sortKey,
        this.appState?.i18n?.lang
      )
      const handles = this._tasks.map(task => task.handle)
      const selected = this._selectedHandles.filter(handle =>
        handles.includes(handle)
      )
      if (selected.length !== this._selectedHandles.length) {
        this._selectedHandles = selected
      }
    }
  }

  get _filterDefinitions() {
    const _ = s => this._(s)
    return [
      textFilter(_, {label: 'Title', rule: 'MatchesTitleSubstringOf'}),
      taskStatusFilter(_),
      taskPriorityFilter(_),
      tagFilter(_),
    ]
  }

  render() {
    return html`
      <grampsjs-filters
        .appState="${this.appState}"
        .definitions="${this._filterDefinitions}"
        namespace="sources"
        @filters:changed="${this._handleFiltersChanged}"
      >
        <div slot="trailing" class="sort-control">${this._renderSort()}</div>
      </grampsjs-filters>
      ${this._canEdit ? this._renderBatchToolbar() : ''}
      ${this._tasks.length === 0 && !this.loading
        ? html`<p class="empty">${this._('None')}</p>`
        : html`<div class="tasks-list">
            ${this._tasks.map(task => this._renderTask(task))}
          </div>`}
      ${this._canEdit ? this._renderStatusMenu() : ''}
    `
  }

  _renderSort() {
    return html`
      <md-filled-select
        aria-label="${this._('Sort by')}"
        title="${this._('Sort by')}"
        @change="${e => {
          this._sortKey = e.target.value
        }}"
      >
        <grampsjs-icon
          slot="leading-icon"
          path="${mdiSort}"
          color="currentColor"
        ></grampsjs-icon>
        ${Object.entries(TASK_SORT_ORDERS).map(
          ([key, {label}]) => html`
            <md-select-option
              value="${key}"
              ?selected="${key === this._sortKey}"
            >
              ${this._(label)}
            </md-select-option>
          `
        )}
      </md-filled-select>
    `
  }

  // The status and priority filters apply here; the event goes on to the
  // view, which loads the tasks for the other filters
  _handleFiltersChanged(e) {
    this._localFilters = e.detail.localFilters ?? []
  }

  get _statusItems() {
    return TASK_STATUSES.map(status => ({
      label: status,
      value: status,
      icon: statusIcon(status, {solid: true}),
    }))
  }

  get _priorityItems() {
    return TASK_PRIORITIES.map(priority => ({
      ...priority,
      icon: PRIORITY_ICONS[priority.label],
    }))
  }

  // the menu of the status icons of the rows, which sets one task's status
  _renderStatusMenu() {
    return html`
      <md-menu
        id="row-status-menu"
        positioning="fixed"
        @closed="${() => {
          this._statusMenuTask = null
        }}"
      >
        ${this._renderMenuItems(this._statusItems, value =>
          this._setStatus(this._statusMenuTask, value)
        )}
      </md-menu>
    `
  }

  // items are {label, value, icon}
  _renderMenuItems(items, onSelect) {
    return items.map(
      item => html`
        <md-menu-item @click="${() => onSelect(item.value)}">
          <grampsjs-icon
            slot="start"
            path="${item.icon.path}"
            color="${item.icon.color ?? nothing}"
            height="20"
            width="20"
          ></grampsjs-icon>
          <div slot="headline">${this._(item.label)}</div>
        </md-menu-item>
      `
    )
  }

  _renderBatchToolbar() {
    const count = this._selectedHandles.length
    const total = this._tasks.length
    return html`
      <div class="batch-toolbar">
        <span class="selection-count">
          <md-checkbox
            ?checked="${count > 0 && count === total}"
            ?indeterminate="${count > 0 && count < total}"
            aria-label="${this._('_Select All')}"
            @change="${this._handleSelectAll}"
          ></md-checkbox>
          <span>${this._('%s selected', count)}</span>
        </span>
        <div class="batch-actions">
          ${this._renderActionMenu(
            'prio',
            this._('Set Priority'),
            this._priorityItems,
            'Priority'
          )}
          ${this._renderActionMenu(
            'status',
            this._('Set Status'),
            this._statusItems,
            'Status'
          )}
        </div>
      </div>
    `
  }

  _renderActionMenu(id, label, items, attribute) {
    return html`
      <div class="menu-anchor">
        <md-outlined-button
          id="${id}-btn"
          ?disabled="${this._selectedHandles.length === 0}"
          @click="${() => {
            this.renderRoot.getElementById(`${id}-menu`).open = true
          }}"
          >${label}</md-outlined-button
        >
        <md-menu id="${id}-menu" anchor="${id}-btn">
          ${this._renderMenuItems(items, value =>
            this._updateAttribute(attribute, value)
          )}
        </md-menu>
      </div>
    `
  }

  _renderTask(task) {
    const status = taskAttribute(task, 'Status')
    const selected = this._selectedHandles.includes(task.handle)
    const content = html`
      <div class="item-content">
        <div class="status-icon">${this._renderStatus(status, task)}</div>
        <div class="title">
          <a
            class="${classMap({
              'title-link': true,
              strike: status === 'Done',
            })}"
            href="/task/${task.gramps_id}"
            >${task.title}</a
          >
          <grampsjs-tag-chips
            dense
            .data="${task.extended.tags.filter(tag => tag.name !== 'ToDo')}"
          ></grampsjs-tag-chips>
        </div>
      </div>
      <div class="task-meta">
        <span class="prio-icon"
          >${this._priorityIcon(
            taskAttribute(task, 'Priority'),
            task.handle
          )}</span
        >
      </div>
    `
    // the title link is the keyboard target, so the row needs no key handler
    // eslint-disable-next-line lit-a11y/click-events-have-key-events
    return html`<div
      class="${classMap({'task-item': true, selected})}"
      @click="${e => this._handleRowClick(e, task)}"
    >
      ${this._canEdit
        ? html`<md-checkbox
            ?checked="${selected}"
            aria-label="${task.title}"
            @change="${() => this._toggleSelected(task.handle)}"
          ></md-checkbox>`
        : ''}
      ${content}
    </div>`
  }

  // for editors, the status icon opens the status menu
  _renderStatus(status, task) {
    const id = `status-icon-${task.handle}`
    const icon = statusIcon(status)
    const iconHtml = html`<grampsjs-icon
      path="${icon.path}"
      color="${icon.color ?? nothing}"
      id="${this._canEdit ? nothing : id}"
      height="20"
      width="20"
    ></grampsjs-icon>`
    return html`
      ${this._canEdit
        ? html`<md-icon-button
            id="${id}"
            aria-label="${this._('Set Status')}"
            @click="${e => this._openStatusMenu(e, task)}"
            >${iconHtml}</md-icon-button
          >`
        : iconHtml}
      <grampsjs-tooltip for="${id}" .appState="${this.appState}"
        >${this._(status ?? '')}</grampsjs-tooltip
      >
    `
  }

  _openStatusMenu(e, task) {
    const menu = this.renderRoot.getElementById('row-status-menu')
    this._statusMenuTask = task
    menu.anchorElement = e.currentTarget
    menu.open = true
  }

  _setStatus(task, value) {
    if (task && value !== taskAttribute(task, 'Status')) {
      fireEvent(this, 'tasks:update-attribute', {
        objects: [task],
        key: 'Status',
        value,
      })
    }
  }

  _priorityIcon(priority, handle) {
    const label = priorityLabel(priority)
    if (!label) {
      return ''
    }
    const id = `priority-icon-${handle}`
    const icon = PRIORITY_ICONS[label]
    return html`
      <span class="priority-label">
        <grampsjs-icon
          path="${icon.path}"
          color="${icon.color ?? nothing}"
          id="${id}"
          height="20"
          width="20"
        ></grampsjs-icon>
        <grampsjs-tooltip for="${id}" .appState="${this.appState}"
          >${this._('Priority')}: ${this._(label)}</grampsjs-tooltip
        >
      </span>
    `
  }

  // clicks on the title link, the checkbox and the status button are left
  // to them
  _handleRowClick(e, task) {
    const path = e.composedPath()
    const inRow = path.slice(0, path.indexOf(e.currentTarget))
    const controls = ['A', 'MD-CHECKBOX', 'MD-ICON-BUTTON']
    if (inRow.some(node => controls.includes(node.tagName))) {
      return
    }
    fireEvent(this, 'nav', {path: `task/${task.gramps_id}`})
  }

  _toggleSelected(handle) {
    this._selectedHandles = this._selectedHandles.includes(handle)
      ? this._selectedHandles.filter(h => h !== handle)
      : [...this._selectedHandles, handle]
  }

  _handleSelectAll() {
    this._selectedHandles =
      this._selectedHandles.length === this._tasks.length
        ? []
        : this._tasks.map(task => task.handle)
  }

  // Each update sends the whole task, so a second action before the list
  // reloads would undo the first; clearing the selection prevents that
  _updateAttribute(key, value) {
    const objects = this.data.filter(task =>
      this._selectedHandles.includes(task.handle)
    )
    this._selectedHandles = []
    fireEvent(this, 'tasks:update-attribute', {objects, key, value})
  }
}

window.customElements.define('grampsjs-tasks', GrampsjsTasks)

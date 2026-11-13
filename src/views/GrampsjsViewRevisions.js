import {css, html} from 'lit'

import '@material/web/list/list'
import '@material/web/list/list-item'
import {
  mdiSourceCommit,
  mdiAccountPlus,
  mdiAccountMultiplePlus,
  mdiCalendarPlus,
  mdiLabel,
  mdiBookmarkPlus,
  mdiArchivePlus,
  mdiImagePlus,
  mdiMapMarkerPlus,
  mdiTextBoxPlus,
  mdiBookOpenVariant,
  mdiAccountEdit,
  mdiAccountMultiple,
  mdiCalendarEdit,
  mdiBookmark,
  mdiArchiveEdit,
  mdiImageEdit,
  mdiMapMarker,
  mdiTextBoxEdit,
  mdiAccountMinus,
  mdiAccountMultipleMinus,
  mdiCalendarMinus,
  mdiBookmarkMinus,
  mdiArchiveMinus,
  mdiImageMinus,
  mdiMapMarkerMinus,
  mdiTextBoxMinus,
  mdiTimelineQuestionOutline,
} from '@mdi/js'

import '../components/GrampsjsPagination.js'
import '../components/GrampsjsIcon.js'

import {GrampsjsView} from './GrampsjsView.js'
import {GrampsjsStaleDataMixin} from '../mixins/GrampsjsStaleDataMixin.js'

const changeIcons = {
  Person_0: mdiAccountPlus,
  Family_0: mdiAccountMultiplePlus,
  Event_0: mdiCalendarPlus,
  Place_0: mdiMapMarkerPlus,
  Source_0: mdiBookOpenVariant,
  Citation_0: mdiBookmarkPlus,
  Repository_0: mdiArchivePlus,
  Note_0: mdiTextBoxPlus,
  Tag_0: mdiLabel,
  Media_0: mdiImagePlus,
  Person_1: mdiAccountEdit,
  Family_1: mdiAccountMultiple,
  Event_1: mdiCalendarEdit,
  Place_1: mdiMapMarker,
  Source_1: mdiBookOpenVariant,
  Citation_1: mdiBookmark,
  Repository_1: mdiArchiveEdit,
  Note_1: mdiTextBoxEdit,
  Tag_1: mdiLabel,
  Media_1: mdiImageEdit,
  Person_2: mdiAccountMinus,
  Family_2: mdiAccountMultipleMinus,
  Event_2: mdiCalendarMinus,
  Place_2: mdiMapMarkerMinus,
  Source_2: mdiBookOpenVariant,
  Citation_2: mdiBookmarkMinus,
  Repository_2: mdiArchiveMinus,
  Note_2: mdiTextBoxMinus,
  Tag_2: mdiLabel,
  Media_2: mdiImageMinus,
}

function localDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

// Splits transactions, newest first, into runs of the same local calendar day
export function groupByDay(transactions) {
  const groups = []
  for (const txn of transactions) {
    const date = new Date(txn.timestamp * 1000)
    const key = localDayKey(date)
    const last = groups[groups.length - 1]
    if (last?.key === key) {
      last.transactions.push(txn)
    } else {
      groups.push({key, date, transactions: [txn]})
    }
  }
  return groups
}

// Counts the changes of a transaction per object class and change type,
// keyed like `changeIcons`
export function countChanges(changes) {
  const counts = {}
  // eslint-disable-next-line camelcase
  for (const {obj_class, trans_type} of changes ?? []) {
    // eslint-disable-next-line camelcase
    const key = `${obj_class}_${trans_type}`
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

export class GrampsjsViewRevisions extends GrampsjsStaleDataMixin(
  GrampsjsView
) {
  static get styles() {
    return [
      super.styles,
      css`
        md-list-item[type='text'] {
          --md-list-item-label-text-color: var(--grampsjs-body-font-color-48);
        }

        h3.day {
          font-family: var(--grampsjs-body-font-family);
          font-size: 14px;
          font-weight: var(--grampsjs-font-weight-medium);
          color: var(--grampsjs-body-font-color-60);
          margin: 16px 0 4px 0;
        }

        h3.day:first-child {
          margin-top: 0;
        }

        md-list {
          padding: 0;
        }

        .changes {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .change {
          position: relative;
          display: inline-flex;
        }

        .change grampsjs-icon {
          height: 22px;
          width: 22px;
          opacity: 0.9;
        }

        .counter {
          position: absolute;
          right: -8px;
          top: -6px;
          color: var(--grampsjs-color-icon);
          font-size: 11px;
          min-width: 14px;
          height: 14px;
          padding: 0 2px;
          box-sizing: border-box;
          line-height: 14px;
          font-weight: 600;
          background-color: var(--grampsjs-color-icon-background);
          border-radius: 100px;
          text-align: center;
        }
      `,
    ]
  }

  static get properties() {
    return {
      _data: {type: Array},
      _page: {type: Number},
      _pages: {type: Number},
      _pageSize: {type: Number},
    }
  }

  constructor() {
    super()
    this._data = []
    this._page = 1
    this._pages = -1
    this._pageSize = 20
  }

  render() {
    return html`
      ${groupByDay(this._data).map(
        group => html`
          <h3 class="day">${this._formatDay(group.date)}</h3>
          <md-list>
            ${group.transactions.map(txn => this._renderTransaction(txn))}
          </md-list>
        `
      )}

      <grampsjs-pagination
        page="${this._page}"
        pages="${this._pages}"
        total="${this._totalCount}"
        pageSize="${this._pageSize}"
        @page:changed="${this._handlePageChanged}"
        .appState="${this.appState}"
      ></grampsjs-pagination>
    `
  }

  _formatDate(date, options) {
    try {
      return date.toLocaleString(
        (this.appState?.i18n?.lang || 'en').replace('_', '-'),
        options
      )
    } catch {
      return date.toLocaleString('en', options)
    }
  }

  _formatDay(date) {
    return this._formatDate(date, {dateStyle: 'full'})
  }

  _formatTime(timestamp) {
    return this._formatDate(new Date(timestamp * 1000), {timeStyle: 'short'})
  }

  _renderTransaction(txn) {
    const counts = countChanges(txn.changes)

    return html`<md-list-item
      ?interactive="${!!txn.changes?.length}"
      type="${txn.changes?.length ? 'link' : 'text'}"
      href="${txn.changes?.length ? `/revision/${txn.id}` : ''}"
    >
      <div slot="headline">${this._(txn.description)}</div>
      <grampsjs-icon
        slot="start"
        path="${mdiSourceCommit}"
        color="var(--grampsjs-body-font-color-50)"
      ></grampsjs-icon>
      <div slot="end" class="changes">
        ${txn.changes?.length
          ? Object.keys(counts).map(key =>
              changeIcons[key]
                ? html`<span class="change">
                    <grampsjs-icon
                      path="${changeIcons[key]}"
                      color="var(--grampsjs-body-font-color-45)"
                    ></grampsjs-icon>
                    ${counts[key] > 1
                      ? html`<span class="counter">${counts[key]}</span>`
                      : ''}
                  </span>`
                : ''
            )
          : html`<span class="change">
              <grampsjs-icon
                path="${mdiTimelineQuestionOutline}"
                color="var(--grampsjs-body-font-color-45)"
              ></grampsjs-icon>
            </span>`}
      </div>
      <div slot="supporting-text">
        <span class="user"
          >${txn.connection?.user
            ? this._renderUser(txn.connection?.user)
            : this._('Unknown')}</span
        >
        &middot;
        <span class="time">${this._formatTime(txn.timestamp)}</span>
      </div>
    </md-list-item>`
  }

  // eslint-disable-next-line class-methods-use-this
  _renderUser(user) {
    return user.full_name || user.name
  }

  async _fetchData() {
    this.loading = true
    const url = `/api/transactions/history/?sort=-id&page=${this._page}&pagesize=${this._pageSize}`
    const data = await this.appState.apiGet(url)
    this.loading = false
    if ('data' in data) {
      this.error = false
      this._data = data.data
      this._totalCount = data.total_count
      this._pages = Math.ceil(this._totalCount / this._pageSize)
    } else if ('error' in data) {
      this.error = true
      this._errorMessage = data.error
    }
  }

  _handlePageChanged(event) {
    this._page = event.detail.page
  }

  firstUpdated() {
    this._fetchData()
  }

  handleUpdateStaleData() {
    this._fetchData()
  }

  update(changed) {
    super.update(changed)
    if (changed.has('_page') && changed._page !== this._page) {
      this._fetchData()
    }
  }
}

window.customElements.define('grampsjs-view-revisions', GrampsjsViewRevisions)

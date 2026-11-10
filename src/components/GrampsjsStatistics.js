/*
The number of objects of each type in the tree, as a table whose rows lead
to the lists
*/

import {LitElement, html, css} from 'lit'

import {sharedStyles} from '../SharedStyles.js'
import {objectIconPath} from '../util.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import './GrampsjsIcon.js'

// [key in the object counts, icon, list path, label]
const TYPES = [
  ['people', 'person', 'people', 'People'],
  ['families', 'family', 'families', 'Families'],
  ['events', 'event', 'events', 'Events'],
  ['places', 'place', 'places', 'Places'],
  ['sources', 'source', 'sources', 'Sources'],
  ['citations', 'citation', 'citations', 'Citations'],
  ['repositories', 'repository', 'repositories', 'Repositories'],
  ['notes', 'note', 'notes', 'Notes'],
  ['media', 'media', 'medialist', 'Media'],
]

export class GrampsjsStatistics extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: block;
        }

        table {
          width: 100%;
          margin: 0 0 8px 0;
          border-collapse: collapse;
        }

        tr {
          position: relative;
        }

        tr:hover td {
          background-color: var(--grampsjs-body-font-color-5);
        }

        td {
          padding: 8px 16px;
        }

        td:first-child {
          border-radius: 8px 0 0 8px;
        }

        td:last-child {
          border-radius: 0 8px 8px 0;
        }

        td.label a,
        td.label a:link,
        td.label a:visited,
        td.label a:hover {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--grampsjs-body-font-color);
          text-decoration: none;
          outline: none;
        }

        /* the link covers the whole row */
        td.label a::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 8px;
        }

        td.label a:focus-visible::after {
          outline: 2px solid var(--md-sys-color-primary);
          outline-offset: -2px;
        }

        td.label grampsjs-icon {
          flex: none;
          color: var(--grampsjs-text-secondary-color);
        }

        td.number {
          text-align: right;
          font-weight: var(--grampsjs-font-weight-medium);
          font-variant-numeric: tabular-nums;
        }
      `,
    ]
  }

  static get properties() {
    return {
      data: {type: Object},
    }
  }

  constructor() {
    super()
    this.data = {}
  }

  render() {
    const format = this._numberFormat()
    return html`
      <h3>${this._('Statistics')}</h3>
      <table>
        ${TYPES.filter(([key]) => key in this.data).map(
          ([key, icon, path, label]) => html`
            <tr>
              <td class="label">
                <a href="/${path}">
                  <grampsjs-icon
                    path="${objectIconPath[icon]}"
                    color="currentColor"
                    height="20"
                    width="20"
                  ></grampsjs-icon>
                  ${this._(label)}
                </a>
              </td>
              <td class="number">${format.format(this.data[key])}</td>
            </tr>
          `
        )}
      </table>
    `
  }

  // Gramps language codes such as pt_BR become the BCP 47 tag pt-BR
  _numberFormat() {
    const lang = (this.appState?.i18n?.lang || '').replace('_', '-')
    try {
      return new Intl.NumberFormat(lang || undefined)
    } catch {
      return new Intl.NumberFormat()
    }
  }
}

window.customElements.define('grampsjs-statistics', GrampsjsStatistics)

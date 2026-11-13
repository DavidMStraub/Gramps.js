import {html, css} from 'lit'

import '@material/web/button/text-button'
import '@material/web/button/filled-tonal-button.js'

import {GrampsjsView} from './GrampsjsView.js'
import './GrampsjsViewRecentlyChanged.js'
import './GrampsjsViewRecentBlogPosts.js'
import './GrampsjsViewAnniversaries.js'
import '../components/GrampsjsHomePerson.js'
import '../components/GrampsjsStatistics.js'
import '../components/GrampsjsConnectedNote.js'
import '../components/GrampsjsImg.js'
import '../components/GrampsjsGetStarted.js'
import {
  TREE_CONFIG_HOME_PAGE_NOTE,
  TREE_CONFIG_HOME_PAGE_IMAGE,
  getTreeName,
} from '../api.js'
import {treeIsEmpty} from '../util.js'

export class GrampsjsViewDashboard extends GrampsjsView {
  static get properties() {
    return {
      dbInfo: {type: Object},
      homePersonDetails: {type: Object},
      homePersonMissing: {type: Boolean},
      homePersonGrampsId: {type: String},
    }
  }

  constructor() {
    super()
    this.dbInfo = {}
    this.homePersonDetails = {}
    this.homePersonMissing = false
    this.homePersonGrampsId = ''
  }

  static get styles() {
    return [
      super.styles,
      css`
        .dashboard {
          max-width: 1200px;
        }

        .dashboard::after {
          content: '';
          display: block;
          clear: both;
        }

        .column {
          float: left;
          width: 50%;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .column.start {
          padding-right: 24px;
        }

        /* each block on a panel in the light primary tint */
        .column > div {
          margin-bottom: 24px;
          /* lists bring their own 16px inset, which the title and other
             content match, so all start 24px from the panel's edge */
          padding: 20px 8px 12px 8px;
          border-radius: 12px;
          background-color: var(--grampsjs-panel-color);
          --grampsjs-h3-margin-top: 0;
          --grampsjs-h3-margin-bottom: 12px;
          --grampsjs-block-inset: 16px;
          /* panel titles: smaller than the page's section headings */
          --grampsjs-h3-font-size: 16px;
          /* lists inside show the panel through */
          --md-list-container-color: transparent;
          --md-list-item-container-color: transparent;
        }

        /* a block that failed to load renders nothing; so does its panel */
        .column > div:has(> [error]) {
          display: none;
        }

        .buttons {
          display: flex;
          gap: 1em;
          flex-wrap: wrap;
          margin: 1em 16px 0 16px;
        }

        /* the header: the tree's name, with the welcome image the owner set
           to its left and the welcome note below it */
        .welcome {
          display: grid;
          grid-template-columns: auto minmax(0, 70ch);
          grid-template-areas:
            'image title'
            'image note';
          grid-template-rows: auto 1fr;
          column-gap: 24px;
          align-items: start;
          /* auto columns would stretch to fill the width */
          justify-content: start;
          margin: 10px 0 32px 0;
        }

        .welcome.no-image {
          grid-template-columns: minmax(0, 70ch);
          grid-template-areas:
            'title'
            'note';
        }

        .welcome h2 {
          grid-area: title;
          margin: 0 0 12px 0;
        }

        .welcome-image {
          grid-area: image;
          max-width: 100%;
        }

        /* the negative margins cancel the outer paragraphs' margins, so the
           text follows the title closely */
        .welcome-note {
          grid-area: note;
          margin: -1.2em 0;
        }

        /* narrow screens: the title first, the image below it */
        @media screen and (max-width: 600px) {
          .welcome,
          .welcome.no-image {
            grid-template-columns: minmax(0, 1fr);
            grid-template-areas:
              'title'
              'image'
              'note';
            grid-template-rows: auto;
            row-gap: 16px;
          }

          .welcome h2 {
            margin-bottom: 0;
          }
        }

        @media screen and (max-width: 768px) {
          .column,
          .column.start {
            width: 100%;
            padding-right: 0;
          }
        }
      `,
    ]
  }

  // The tree's name, with the welcome image and note an owner can set for
  // the home page
  _renderWelcome(treeName) {
    const noteHandle =
      this.appState.treeConfig?.[TREE_CONFIG_HOME_PAGE_NOTE] ?? ''
    const imageHandle =
      this.appState.treeConfig?.[TREE_CONFIG_HOME_PAGE_IMAGE] ?? ''
    if (!treeName && !noteHandle && !imageHandle) {
      return ''
    }
    return html`
      <div class="welcome ${imageHandle ? '' : 'no-image'}">
        ${treeName ? html`<h2>${treeName}</h2>` : ''}
        ${imageHandle
          ? html`<div class="welcome-image">
              <grampsjs-img
                handle="${imageHandle}"
                size="300"
                displayHeight="180"
                radius="12"
              ></grampsjs-img>
            </div>`
          : ''}
        ${noteHandle
          ? html`<div class="welcome-note">
              <grampsjs-connected-note
                handle="${noteHandle}"
                .framed="${false}"
                .appState="${this.appState}"
              ></grampsjs-connected-note>
            </div>`
          : ''}
      </div>
    `
  }

  // True while the tree holds no objects of any kind, so the dashboard can drop
  // the panels that would render as a row of blanks.
  get _treeIsEmpty() {
    return treeIsEmpty(this.appState.dbInfo)
  }

  // Onboarding guidance that advances with the tree: create the first person,
  // then connect people into families. It ends once families exist.
  _renderGetStarted() {
    const counts = this.appState.dbInfo?.object_counts
    if (!counts || !this.appState.permissions.canAdd) {
      return ''
    }
    if (counts.people === 0) {
      return html`
        <div>
          <h3>${this._('Get started')}</h3>
          <grampsjs-get-started
            .appState="${this.appState}"
          ></grampsjs-get-started>
        </div>
      `
    }
    if (!counts.families) {
      return this._renderGetStartedCard(
        this._('Connect the people in your tree by adding a family.'),
        html`<md-filled-tonal-button href="/new_family"
          >${this._('New Family')}</md-filled-tonal-button
        >`
      )
    }
    return ''
  }

  _renderGetStartedCard(text, buttons) {
    return html`
      <div>
        <h3>${this._('Get started')}</h3>
        <p>${text}</p>
        <div class="buttons">${buttons}</div>
      </div>
    `
  }

  renderContent() {
    const treeName = getTreeName(this.appState)
    return html`
      <div class="dashboard">
        ${this._renderWelcome(treeName)}
        <div class="column start">
          ${this._renderGetStarted()}
          ${this.appState.dbInfo?.object_counts?.people ||
          this.homePersonGrampsId
            ? html`
                <div>
                  <grampsjs-home-person
                    id="homeperson"
                    .appState="${this.appState}"
                    .homePersonDetails=${this.homePersonDetails}
                    .homePersonMissing=${this.homePersonMissing}
                    .homePersonGrampsId=${this.homePersonGrampsId}
                  >
                  </grampsjs-home-person>
                </div>
              `
            : ''}
          ${this.appState.dbInfo?.object_counts?.events
            ? html`
                <div>
                  <grampsjs-view-anniversaries
                    id="anniversaries"
                    .appState="${this.appState}"
                  >
                  </grampsjs-view-anniversaries>
                </div>
              `
            : ''}
          ${this._treeIsEmpty
            ? ''
            : html`
                <div>
                  <grampsjs-view-recently-changed
                    id="recently-changed"
                    .appState="${this.appState}"
                  >
                  </grampsjs-view-recently-changed>
                </div>
              `}
        </div>
        <div class="column">
          ${this._treeIsEmpty
            ? ''
            : html`
                <div>
                  <grampsjs-view-recent-blog-posts
                    id="recent-blog"
                    .appState="${this.appState}"
                  >
                  </grampsjs-view-recent-blog-posts>
                </div>
                <div>
                  <grampsjs-statistics
                    .data="${this.dbInfo?.object_counts || {}}"
                    id="statistics"
                    .appState="${this.appState}"
                  >
                  </grampsjs-statistics>
                </div>
              `}
        </div>
      </div>
    `
  }
}

window.customElements.define('grampsjs-view-dashboard', GrampsjsViewDashboard)

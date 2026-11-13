import {css, html} from 'lit'
import {mdiPlus} from '@mdi/js'

import '@material/web/fab/fab.js'
import '@material/web/button/filled-tonal-button.js'
import {GrampsjsView} from './GrampsjsView.js'
import '../components/GrampsjsBlogPostPreview.js'
import '../components/GrampsjsIcon.js'

import {GrampsjsStaleDataMixin} from '../mixins/GrampsjsStaleDataMixin.js'

import {fireEvent} from '../util.js'

export class GrampsjsViewBlog extends GrampsjsStaleDataMixin(GrampsjsView) {
  static get styles() {
    return [
      super.styles,
      css`
        h2 {
          margin-left: 15px;
        }

        #posts {
          display: grid;
          gap: 40px 24px;
          grid-template-columns: repeat(
            auto-fill,
            minmax(min(420px, 100%), 1fr)
          );
        }

        .post {
          display: block;
          padding: 16px;
          border-radius: 8px;
          cursor: pointer;
          outline: none;
          transition: background-color 150ms;
        }

        /* the whole post is the link: a neutral hover layer shows it */
        .post:hover {
          background-color: var(--grampsjs-body-font-color-5);
        }

        a.post:link,
        a.post:visited,
        a.post:hover {
          color: inherit;
          text-decoration: none;
        }

        .post:focus-visible {
          background-color: var(--grampsjs-body-font-color-5);
          outline: 2px solid var(--md-sys-color-primary);
          outline-offset: -2px;
        }

        md-fab {
          position: fixed;
          bottom: 32px;
          right: 32px;
        }
      `,
    ]
  }

  static get properties() {
    return {
      _dataSources: {type: Array},
      _dataNotes: {type: Array},
      _totalCount: {type: Number},
      _page: {type: Number},
      _pages: {type: Number},
    }
  }

  constructor() {
    super()
    this._dataSources = []
    this._dataNotes = []
    this._page = 1
    this._pageSize = 6
    this._firstLoaded = false
    this._totalCount = -1
    this._pages = -1
  }

  renderContent() {
    return html`
      ${this.renderPosts()}
      ${this._totalCount > 0 ? this.renderPagination() : ''}
      ${this.appState.permissions.canAdd ? this.renderFab() : ''}
    `
  }

  renderFab() {
    return html`
      <md-fab variant="primary" @click=${this._handleClickAdd}>
        <grampsjs-icon
          slot="icon"
          .path="${mdiPlus}"
          color="currentColor"
        ></grampsjs-icon>
      </md-fab>
    `
  }

  _handleClickAdd() {
    fireEvent(this, 'nav', {path: 'new_blog_post'})
  }

  renderPosts() {
    if (this._firstLoaded && this._dataSources.length === 0) {
      if (!this.appState.permissions.canAdd) {
        return ''
      }
      return html`
        <md-filled-tonal-button href="/new_blog_post">
          <grampsjs-icon
            slot="icon"
            .path="${mdiPlus}"
            color="currentColor"
          ></grampsjs-icon>
          ${this._('New Blog Post')}
        </md-filled-tonal-button>
      `
    }
    if (this.loading) {
      return html``
    }
    return html`
      <div id="posts">
        ${this._dataSources.map(
          (source, i) => this.renderPost(source, this._dataNotes[i]),
          this
        )}
      </div>
    `
  }

  renderPagination() {
    return html`
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

  _handlePageChanged(event) {
    this._page = event.detail.page
    this._fetchData()
  }

  // eslint-disable-next-line no-dupe-class-members
  renderPost(source) {
    return html`
      <a class="post" href="/blog/${source.gramps_id}">
        <div>
          <grampsjs-blog-post-preview
            .data="${source}"
            .appState="${this.appState}"
          ></grampsjs-blog-post-preview>
        </div>
      </a>
    `
  }

  firstUpdated() {
    this._fetchData()
  }

  handleUpdateStaleData() {
    this._fetchData()
  }

  async _fetchData() {
    this.loading = true
    const rules = {
      rules: [
        {
          name: 'HasTag',
          values: ['Blog'],
        },
      ],
    }
    const uri = `/api/sources/?rules=${encodeURIComponent(
      JSON.stringify(rules)
    )}&page=${this._page}&pagesize=${this._pageSize}&sort=-change&locale=${
      this.appState.i18n.lang || 'en'
    }&profile=all&extend=all`
    await this.appState.apiGet(uri).then(data => {
      if ('data' in data) {
        this.error = false
        this._dataSources = data.data
        this._totalCount = data.total_count
        this._pages = Math.ceil(this._totalCount / this._pageSize)
      } else if ('error' in data) {
        this.error = true
        this._errorMessage = data.error
      }
    })
    this.loading = false
    this._firstLoaded = true
  }
}

window.customElements.define('grampsjs-view-blog', GrampsjsViewBlog)

import {html, css} from 'lit'

import {GrampsjsConnectedComponent} from '../components/GrampsjsConnectedComponent.js'
import '../components/GrampsjsSearchResultList.js'
import {blogRules, formatBlogPostDate, sortBlogPosts} from '../blog.js'

export class GrampsjsViewRecentBlogPosts extends GrampsjsConnectedComponent {
  static get styles() {
    return [
      super.styles,
      css`
        .change {
          font-size: 0.8em;
          color: var(--grampsjs-text-secondary-color);
          margin-top: 0.3em;
        }

        h3 {
          margin-bottom: 15px;
        }
      `,
    ]
  }

  renderContent() {
    if (!this._data?.data?.length) {
      return html`
        <h3>${this._('Latest Blog Post')}</h3>
        <p>${this._('None')}.</p>
      `
    }
    const [latest] = sortBlogPosts(this._data.data)
    return html`
      <h3>${this._('Latest Blog Post')}</h3>
      <grampsjs-search-result-list
        large
        linked
        .data="${[
          {
            object: latest,
            object_type: 'source',
            path: `blog/${latest.gramps_id}`,
            secondary: formatBlogPostDate(latest, this.appState.i18n.lang),
          },
        ]}"
        .appState="${this.appState}"
        noSep
      >
      </grampsjs-search-result-list>
    `
  }

  renderLoading() {
    return html`
      <h3>${this._('Latest Blog Post')}</h3>
      <grampsjs-search-result-list
        .data="${this._data.data}"
        .appState="${this.appState}"
        loading
        numberLoading="1"
        noSep
      ></grampsjs-search-result-list>
    `
  }

  // the API can't sort by the date attribute, so this fetches all posts
  getUrl() {
    return `/api/sources/?rules=${encodeURIComponent(
      JSON.stringify(blogRules)
    )}&extend=media_list&keys=handle,gramps_id,title,attribute_list,change,media_list,extended`
  }
}

window.customElements.define(
  'grampsjs-view-recent-blog-posts',
  GrampsjsViewRecentBlogPosts
)

import {css, html, LitElement} from 'lit'
import '@material/web/button/filled-tonal-button.js'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'

/**
 * The ways to put the first people into an empty tree: creating a person and,
 * for users allowed to import, importing a family tree file. Renders nothing
 * for users who can add neither.
 */
export class GrampsjsGetStarted extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        .buttons {
          display: flex;
          gap: 1em;
          flex-wrap: wrap;
          margin-inline: var(--grampsjs-block-inset, 0);
        }
      `,
    ]
  }

  render() {
    const {canAdd, canImport} = this.appState?.permissions ?? {}
    if (!canAdd) {
      return ''
    }
    return html`
      <p>
        ${canImport
          ? this._(
              'To start building your family tree, add yourself as a person or import a family tree file.'
            )
          : this._(
              'To start building your family tree, add yourself as a person.'
            )}
      </p>
      <div class="buttons">
        <md-filled-tonal-button href="/new_person"
          >${this._('New Person')}</md-filled-tonal-button
        >
        ${canImport
          ? html`<md-filled-tonal-button href="/import"
              >${this._('Import Family Tree')}</md-filled-tonal-button
            >`
          : ''}
      </div>
    `
  }
}

window.customElements.define('grampsjs-get-started', GrampsjsGetStarted)

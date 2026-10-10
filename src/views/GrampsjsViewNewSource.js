import {html} from 'lit'

import {GrampsjsViewNewObject} from './GrampsjsViewNewObject.js'
import {GrampsjsNewSourceMixin} from '../mixins/GrampsjsNewSourceMixin.js'

export class GrampsjsViewNewSource extends GrampsjsNewSourceMixin(
  GrampsjsViewNewObject
) {
  constructor() {
    super()
    this.postUrl = '/api/sources/'
    this.itemPath = 'source'
    this.objClass = 'Source'
  }

  renderContent() {
    return html`
      <h2>${this._('New Source')}</h2>
      ${this.renderForm()} ${this.renderButtons()}
    `
  }
}

window.customElements.define('grampsjs-view-new-source', GrampsjsViewNewSource)

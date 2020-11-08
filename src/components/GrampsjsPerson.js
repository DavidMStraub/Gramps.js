import { html, css } from 'lit-element';
import { GrampsjsObject } from './GrampsjsObject.js'


export class GrampsjsPerson extends GrampsjsObject {
  static get styles() {
    return [
      super.styles,
      css`
      :host {
        display: block;
        padding: 25px;
        color: var(--grampsjs-person-text-color, #000);
      }
    `];
  }

  render() {
    if (!this.data || !this.data.profile) {
      return html``
    }
    return html`
    <h2>${this._displayName()}</h2>
    <dl>
      <dt>Born</dt>
      <dd>${this._getProfileEvent('Birth')}</dd>
      <dt>Died</dt>
      <dd>${this._getProfileEvent('Death')}</dd>
    </dl>
    `;
  }

  _displayName() {
    if (!this.data.profile) {
      return ''
    }
    const surname = this.data.profile.name_surname || 'NN';
    const given = this.data.profile.name_given || 'NN';
    return html`${surname}, ${given}`
  }

  _getProfileEvent(type) {
    if (!(this.data.profile && this.data.profile.events)) {
      return '';
    }
    for (const event of this.data.profile.events) {
      if (event.type === type) {
        return html`${event.date} ${this._('in')} ${event.place}`
      }
    }
    return '';
  }

}


window.customElements.define('grampsjs-person', GrampsjsPerson);
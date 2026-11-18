import {html, css, LitElement} from 'lit'
import {GrampsjsEditMatchMixin} from '../mixins/GrampsjsEditMatchMixin.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {sharedStyles} from '../SharedStyles.js'
import {matchAssociation, matchSegmentNoteHandles} from '../dnaMatch.js'
import './GrampsjsFormPrivate.js'

import {fireEvent, toWritableObject} from '../util.js'

export class GrampsjsFormEditMatch extends GrampsjsEditMatchMixin(
  GrampsjsAppStateMixin(LitElement)
) {
  static get properties() {
    return {
      // handle of the person whose association records the match
      personHandle: {type: String},
      // the association that records the match
      association: {type: Object},
      // the privacy chosen with the switch, null until it is switched
      _private: {type: Boolean},
      // whether a note with the segments is private
      _notePrivate: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.personHandle = ''
    this.association = null
    this._private = null
    this._notePrivate = false
    // Keep a stable listener reference so global edit-mode hooks can be removed.
    this._boundHandleSaveButton = this._handleSaveButton.bind(this)
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        md-outlined-text-field {
          width: 100%;
        }
      `,
    ]
  }

  get isValid() {
    return this.isFormValid
  }

  // The match is private if the association or a note with its segments is,
  // so that saving makes both private
  get _isPrivate() {
    return this._private ?? (!!this.association?.private || this._notePrivate)
  }

  get _segmentNoteHandles() {
    return matchSegmentNoteHandles(this.association, this.data)
  }

  render() {
    return html`
      <div @formdata:changed="${this._handleFormData}">
        ${this.renderEditor()}
        <p>
          <grampsjs-form-private
            id="private"
            ?checked="${this._isPrivate}"
            .appState="${this.appState}"
          ></grampsjs-form-private>
        </p>
        ${this.renderPreview()}
      </div>
    `
  }

  firstUpdated() {
    this._loadNotePrivacy()
  }

  async _loadNotePrivacy() {
    const notes = await Promise.all(
      this._segmentNoteHandles.map(handle =>
        this.appState.apiGet(`/api/notes/${handle}`)
      )
    )
    this._notePrivate = notes.some(note => note.data?.private)
  }

  _handleFormData(e) {
    if (e.composedPath()[0].id === 'private') {
      this._private = e.detail.checked
      return
    }
    this.data = {...this.data, raw_data: [e.detail.data]}
    this.checkFormValidity()
  }

  // The writes do not announce the database change, since the view would
  // reload and remove this form while it is saving. Edit mode ends and the
  // change is announced after the last write, while the form is connected.
  async _handleSaveButton() {
    const changed = await this._save()
    fireEvent(this, 'edit-mode:off')
    if (changed) {
      fireEvent(this, 'db:changed')
    }
  }

  // Saves the raw data and the privacy, and returns whether anything changed
  async _save() {
    const isPrivate = this._isPrivate
    const notesChanged = await this._saveNotes(isPrivate)
    const associationChanged = await this._saveAssociationPrivacy(isPrivate)
    return notesChanged || associationChanged
  }

  // The raw data field edits the first note with segments, and the privacy
  // applies to the notes with segments that are attached to the association
  async _saveNotes(isPrivate) {
    const noteText = this.data.raw_data?.[0]
    const textHandle = noteText ? this.data.note_handles?.[0] : undefined
    const privacyHandles = this._segmentNoteHandles
    const handles = [...new Set([textHandle, ...privacyHandles])].filter(
      Boolean
    )
    let changed = false
    for (const handle of handles) {
      // eslint-disable-next-line no-await-in-loop
      const noteChanged = await this._saveNote(handle, {
        text: handle === textHandle ? noteText : null,
        isPrivate: privacyHandles.includes(handle) ? isPrivate : null,
      })
      changed = changed || noteChanged
    }
    return changed
  }

  // Saves the note with `text` and `isPrivate`, either of which is null to
  // keep it unchanged, and returns whether it was saved
  async _saveNote(handle, {text, isPrivate}) {
    const noteData = await this.appState.apiGet(`/api/notes/${handle}`)
    if ('error' in noteData) {
      fireEvent(this, 'grampsjs:error', {message: noteData.error})
      return false
    }
    const note = toWritableObject(noteData.data)
    const textChanged = text !== null
    const privacyChanged = isPrivate !== null && !!note.private !== isPrivate
    if (!textChanged && !privacyChanged) return false
    const data = await this.appState.apiPut(
      `/api/notes/${handle}`,
      {
        ...note,
        ...(textChanged && {
          text: {_class: 'StyledText', string: text, tags: []},
        }),
        ...(privacyChanged && {private: isPrivate}),
      },
      {dbChanged: false}
    )
    if ('error' in data) {
      fireEvent(this, 'grampsjs:error', {message: data.error})
      return false
    }
    return true
  }

  // Saves the privacy of the association, and returns whether it changed
  async _saveAssociationPrivacy(isPrivate) {
    if (!this.personHandle) return false
    const url = `/api/people/${this.personHandle}`
    const personData = await this.appState.apiGet(url)
    if ('error' in personData) {
      fireEvent(this, 'grampsjs:error', {message: personData.error})
      return false
    }
    const person = toWritableObject(personData.data)
    const association = matchAssociation(person, this.data)
    if (association === null || !!association.private === isPrivate) {
      return false
    }
    const index = this.data.person_ref_idx
    const data = await this.appState.apiPut(
      url,
      {
        ...person,
        person_ref_list: person.person_ref_list.map((ref, i) =>
          i === index ? {...ref, private: isPrivate} : ref
        ),
      },
      {dbChanged: false}
    )
    if ('error' in data) {
      fireEvent(this, 'grampsjs:error', {message: data.error})
      return false
    }
    return true
  }

  connectedCallback() {
    super.connectedCallback()
    window.addEventListener('edit-mode:save', this._boundHandleSaveButton)
  }

  disconnectedCallback() {
    window.removeEventListener('edit-mode:save', this._boundHandleSaveButton)
    super.disconnectedCallback()
  }
}

window.customElements.define('grampsjs-form-edit-match', GrampsjsFormEditMatch)

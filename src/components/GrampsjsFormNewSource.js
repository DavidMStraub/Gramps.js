import {GrampsjsObjectForm} from './GrampsjsObjectForm.js'
import {GrampsjsNewSourceMixin} from '../mixins/GrampsjsNewSourceMixin.js'
import {GrampsjsNewObjectTagsMixin} from '../mixins/GrampsjsNewObjectTagsMixin.js'

export class GrampsjsFormNewSource extends GrampsjsNewObjectTagsMixin(
  GrampsjsNewSourceMixin(GrampsjsObjectForm)
) {
  get isValid() {
    return this.isFormValid
  }
}

window.customElements.define('grampsjs-form-new-source', GrampsjsFormNewSource)

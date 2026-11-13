import {describe, it, expect} from 'vitest'
import {docUrl} from '../../src/docs.js'

describe('docUrl', () => {
  it('links English docs without a language prefix', () => {
    expect(docUrl('administration/import/', 'en')).to.equal(
      'https://www.grampsweb.org/administration/import/'
    )
  })

  it('prefixes languages with translated docs', () => {
    expect(docUrl('user-guide', 'de')).to.equal(
      'https://www.grampsweb.org/de/user-guide'
    )
  })

  it('uses the base language of a regional language code', () => {
    expect(docUrl('user-guide', 'pt_BR')).to.equal(
      'https://www.grampsweb.org/pt/user-guide'
    )
  })

  it('falls back to English for languages without translated docs', () => {
    expect(docUrl('user-guide', 'nl')).to.equal(
      'https://www.grampsweb.org/user-guide'
    )
  })

  it('falls back to English without a language', () => {
    expect(docUrl('user-guide')).to.equal(
      'https://www.grampsweb.org/user-guide'
    )
    expect(docUrl('user-guide', undefined)).to.equal(
      'https://www.grampsweb.org/user-guide'
    )
  })
})

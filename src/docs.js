// Links into the Gramps Web documentation at grampsweb.org

const DOCS_BASE_URL = 'https://www.grampsweb.org/'

// Languages other than English with translated documentation
export const DOC_LANGS = [
  'de',
  'fr',
  'es',
  'zh',
  'vi',
  'tr',
  'ru',
  'pt',
  'ja',
  'da',
  'fi',
  'it',
  'uk',
]

// The URL of the docs page at `path`, such as 'administration/import/', in
// the language of the app's language code `lang`, such as 'de' or 'pt_BR'.
// Languages without translated docs get the English page.
export function docUrl(path, lang = '') {
  const docLang = (lang ?? '').substring(0, 2)
  const prefix = DOC_LANGS.includes(docLang) ? `${docLang}/` : ''
  return `${DOCS_BASE_URL}${prefix}${path}`
}

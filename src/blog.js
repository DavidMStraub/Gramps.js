// Helpers for blog posts: sources tagged "Blog" whose publication date is
// stored as a source attribute.

import {intlLocale} from './util.js'

// The source attribute type holding a post's date as "YYYY-MM-DD".
export const BLOG_DATE_ATTRIBUTE = 'Date'

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

// The date in a "YYYY-MM-DD" string as a UTC Date, or null if the string
// is not a valid calendar date.
function parseIsoDate(value) {
  const match = ISO_DATE.exec(value?.trim?.() ?? '')
  if (!match) {
    return null
  }
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return date
}

// Today's date in the local time zone as "YYYY-MM-DD".
export function todayIsoDate(now = new Date()) {
  const pad = n => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// The date attribute for a post published on the given "YYYY-MM-DD" date.
export function blogDateAttribute(value) {
  return {_class: 'SrcAttribute', type: BLOG_DATE_ATTRIBUTE, value}
}

// A post's date as {date, utc}. It is the date attribute if the source has
// a valid one (a calendar date, so `utc` is true), else the source's last
// change time (a moment, shown in the local time zone).
export function blogPostDate(source) {
  const attr = (source?.attribute_list ?? []).find(
    att => att.type === BLOG_DATE_ATTRIBUTE && parseIsoDate(att.value)
  )
  if (attr) {
    return {date: parseIsoDate(attr.value), utc: true}
  }
  if (source?.change) {
    return {date: new Date(source.change * 1000), utc: false}
  }
  return null
}

// A post's date formatted for the given Gramps language code.
export function formatBlogPostDate(source, lang = 'en') {
  const postDate = blogPostDate(source)
  if (!postDate) {
    return ''
  }
  return postDate.date.toLocaleDateString(intlLocale(lang), {
    dateStyle: 'long',
    ...(postDate.utc ? {timeZone: 'UTC'} : {}),
  })
}

// The calendar day a post's date is shown on, as a UTC timestamp.
function blogPostDay(source) {
  const postDate = blogPostDate(source)
  if (!postDate) {
    return 0
  }
  const {date, utc} = postDate
  return utc
    ? date.getTime()
    : Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

// The posts sorted newest first by the day they are shown on; posts on the
// same day are ordered by their last change.
export function sortBlogPosts(sources) {
  return [...sources].sort(
    (a, b) =>
      blogPostDay(b) - blogPostDay(a) || (b.change ?? 0) - (a.change ?? 0)
  )
}

// The rules matching all blog posts.
export const blogRules = {rules: [{name: 'HasTag', values: ['Blog']}]}

// The rules matching the sources with the given Gramps IDs.
export function grampsIdRules(grampsIds) {
  return {
    function: 'or',
    rules: grampsIds.map(id => ({name: 'HasIdOf', values: [id]})),
  }
}

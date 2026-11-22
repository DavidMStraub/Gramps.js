import {describe, it, expect, vi} from 'vitest'
import {
  blogPostDate,
  formatBlogPostDate,
  grampsIdRules,
  sortBlogPosts,
  todayIsoDate,
} from '../../src/blog.js'
import {GrampsjsViewBlog} from '../../src/views/GrampsjsViewBlog.js'
import {GrampsjsViewRecentBlogPosts} from '../../src/views/GrampsjsViewRecentBlogPosts.js'

const dateAttr = value => ({_class: 'SrcAttribute', type: 'Date', value})

// 2026-11-22 14:00 UTC
const CHANGE = Date.UTC(2026, 10, 22, 14) / 1000

describe('blogPostDate', () => {
  it('uses the date attribute as a UTC calendar date', () => {
    const source = {change: CHANGE, attribute_list: [dateAttr('2024-03-05')]}
    expect(blogPostDate(source)).toEqual({
      date: new Date(Date.UTC(2024, 2, 5)),
      utc: true,
    })
  })

  it('falls back to the last change without a valid date attribute', () => {
    const fallback = {date: new Date(CHANGE * 1000), utc: false}
    expect(blogPostDate({change: CHANGE})).toEqual(fallback)
    for (const value of ['2024-02-30', '5 March 2024', '2024-3-5', '']) {
      expect(
        blogPostDate({change: CHANGE, attribute_list: [dateAttr(value)]})
      ).toEqual(fallback)
    }
  })

  it('ignores attributes of other types', () => {
    const source = {
      change: CHANGE,
      attribute_list: [
        {_class: 'SrcAttribute', type: 'Published', value: '2024-03-05'},
      ],
    }
    expect(blogPostDate(source).utc).toBe(false)
  })

  it('skips an invalid date attribute in favour of a valid one', () => {
    const source = {
      change: CHANGE,
      attribute_list: [dateAttr('soon'), dateAttr('2024-03-05')],
    }
    expect(blogPostDate(source).date).toEqual(new Date(Date.UTC(2024, 2, 5)))
  })

  it('is null without a date or change', () => {
    expect(blogPostDate({})).toBeNull()
  })
})

describe('formatBlogPostDate', () => {
  it('formats the date attribute on its calendar day in the locale', () => {
    const source = {attribute_list: [dateAttr('2024-03-05')]}
    expect(formatBlogPostDate(source, 'en')).toBe('March 5, 2024')
    expect(formatBlogPostDate(source, 'de')).toBe('5. März 2024')
  })

  it('formats the last change as a date in the same style', () => {
    const expected = new Date(CHANGE * 1000).toLocaleDateString('en-GB', {
      dateStyle: 'long',
    })
    expect(formatBlogPostDate({change: CHANGE}, 'en_GB')).toBe(expected)
  })

  it('is empty without a date', () => {
    expect(formatBlogPostDate({}, 'en')).toBe('')
  })
})

describe('todayIsoDate', () => {
  it('is the local calendar date', () => {
    expect(todayIsoDate(new Date(2026, 0, 3, 23, 59))).toBe('2026-01-03')
  })
})

describe('sortBlogPosts', () => {
  it('sorts newest first, mixing dates and last changes', () => {
    const posts = [
      {handle: 'a', change: CHANGE, attribute_list: [dateAttr('2020-01-01')]},
      {handle: 'b', change: Date.UTC(2023, 0, 1) / 1000},
      {handle: 'c', change: 1, attribute_list: [dateAttr('2025-06-01')]},
    ]
    expect(sortBlogPosts(posts).map(p => p.handle)).toEqual(['c', 'b', 'a'])
  })

  it('orders posts with the same date by their last change', () => {
    const posts = [
      {handle: 'a', change: 100, attribute_list: [dateAttr('2025-06-01')]},
      {handle: 'b', change: 200, attribute_list: [dateAttr('2025-06-01')]},
    ]
    expect(sortBlogPosts(posts).map(p => p.handle)).toEqual(['b', 'a'])
  })

  it('sorts by the calendar day shown in the local time zone', () => {
    const tz = process.env.TZ
    process.env.TZ = 'America/Los_Angeles'
    try {
      // 07:00 UTC on 22 November is 21 November in Los Angeles
      const legacy = {
        handle: 'legacy',
        change: Date.UTC(2026, 10, 22, 7) / 1000,
      }
      const dated = {
        handle: 'dated',
        change: 1,
        attribute_list: [dateAttr('2026-11-22')],
      }
      expect(formatBlogPostDate(legacy, 'en')).toBe('November 21, 2026')
      expect(sortBlogPosts([legacy, dated]).map(p => p.handle)).toEqual([
        'dated',
        'legacy',
      ])
    } finally {
      process.env.TZ = tz
    }
  })

  it('orders a legacy post and a dated post on the same day by last change', () => {
    const tz = process.env.TZ
    process.env.TZ = 'UTC'
    try {
      const legacy = {
        handle: 'legacy',
        change: Date.UTC(2026, 10, 22, 7) / 1000,
      }
      const dated = {
        handle: 'dated',
        change: Date.UTC(2026, 10, 22, 8) / 1000,
        attribute_list: [dateAttr('2026-11-22')],
      }
      expect(sortBlogPosts([legacy, dated]).map(p => p.handle)).toEqual([
        'dated',
        'legacy',
      ])
    } finally {
      process.env.TZ = tz
    }
  })

  it('does not modify its input', () => {
    const posts = [
      {handle: 'a', change: 1},
      {handle: 'b', change: 2},
    ]
    sortBlogPosts(posts)
    expect(posts.map(p => p.handle)).toEqual(['a', 'b'])
  })
})

describe('grampsIdRules', () => {
  it('matches any of the IDs', () => {
    expect(grampsIdRules(['S1', 'S2'])).toEqual({
      function: 'or',
      rules: [
        {name: 'HasIdOf', values: ['S1']},
        {name: 'HasIdOf', values: ['S2']},
      ],
    })
  })
})

describe('blog view: fetching', () => {
  const posts = [
    {handle: 'h1', gramps_id: 'S1', change: Date.UTC(2026, 0, 20) / 1000},
    {handle: 'h2', gramps_id: 'S2', change: Date.UTC(2026, 0, 10) / 1000},
    {
      handle: 'h3',
      gramps_id: 'S3',
      change: Date.UTC(2026, 0, 30) / 1000,
      attribute_list: [dateAttr('2026-01-01')],
    },
  ]

  const makeView = full => {
    const view = new GrampsjsViewBlog()
    view._pageSize = 2
    const apiGet = vi.fn(encoded => {
      const url = decodeURIComponent(encoded)
      return Promise.resolve(
        url.includes('HasIdOf')
          ? {data: full.filter(s => url.includes(`"${s.gramps_id}"`))}
          : {data: posts}
      )
    })
    view.appState = {apiGet, i18n: {lang: 'en'}}
    return view
  }

  it('shows the page of posts in date order', async () => {
    // the API returns the page's posts in its own order
    const full = [
      {handle: 'h2', gramps_id: 'S2', title: 'Two'},
      {handle: 'h1', gramps_id: 'S1', title: 'One'},
    ]
    const view = makeView(full)

    await view._fetchData()

    expect(view._dataSources.map(s => s.title)).toEqual(['One', 'Two'])
    expect(view._totalCount).toBe(3)
    expect(view._pages).toBe(2)
    expect(view.loading).toBe(false)
  })

  it('fetches only the posts of the current page', async () => {
    const full = [{handle: 'h3', gramps_id: 'S3', title: 'Three'}]
    const view = makeView(full)
    view._page = 2

    await view._fetchData()

    const pageUrl = decodeURIComponent(view.appState.apiGet.mock.calls[1][0])
    expect(pageUrl).toContain('"S3"')
    expect(pageUrl).not.toContain('"S1"')
    expect(view._dataSources.map(s => s.title)).toEqual(['Three'])
  })

  it('does not fetch posts when there are none', async () => {
    const view = new GrampsjsViewBlog()
    const apiGet = vi.fn().mockResolvedValue({data: []})
    view.appState = {apiGet, i18n: {lang: 'en'}}

    await view._fetchData()

    expect(apiGet).toHaveBeenCalledOnce()
    expect(view._dataSources).toEqual([])
    expect(view._totalCount).toBe(0)
  })

  it('reports an error from the list request', async () => {
    const view = new GrampsjsViewBlog()
    const apiGet = vi.fn().mockResolvedValue({error: 'Nope'})
    view.appState = {apiGet, i18n: {lang: 'en'}}

    await view._fetchData()

    expect(apiGet).toHaveBeenCalledOnce()
    expect(view.error).toBe(true)
    expect(view._errorMessage).toBe('Nope')
    expect(view.loading).toBe(false)
  })
})

describe('latest blog post widget: fetching', () => {
  const makeWidget = responses => {
    const widget = new GrampsjsViewRecentBlogPosts()
    const apiGet = vi.fn(url =>
      Promise.resolve(
        url.startsWith('/api/sources/?') ? responses.list : responses.post
      )
    )
    widget.appState = {apiGet, i18n: {lang: 'en'}}
    return widget
  }

  it('fetches the media of the latest post only', async () => {
    const widget = makeWidget({
      list: {
        data: [
          {handle: 'old', change: 100},
          {handle: 'new', change: 1, attribute_list: [dateAttr('2026-01-01')]},
        ],
      },
      post: {data: {handle: 'new', gramps_id: 'S2', title: 'New'}},
    })

    await widget._updateGetData(widget.getUrl())

    const [[listUrl], [postUrl]] = widget.appState.apiGet.mock.calls
    expect(listUrl).not.toContain('extend')
    expect(postUrl).toMatch(/^\/api\/sources\/new\?extend=media_list&/)
    expect(widget._data.data).toEqual([
      {handle: 'new', gramps_id: 'S2', title: 'New'},
    ])
    expect(widget.error).toBe(false)
  })

  it('has no data and makes one request when there are no posts', async () => {
    const widget = makeWidget({list: {data: []}})

    await widget._updateGetData(widget.getUrl())

    expect(widget.appState.apiGet).toHaveBeenCalledOnce()
    expect(widget._data.data).toEqual([])
  })

  it('reports an error from either request', async () => {
    const listError = makeWidget({list: {error: 'Nope'}})
    await listError._updateGetData(listError.getUrl())
    expect(listError.error).toBe(true)
    expect(listError._errorMessage).toBe('Nope')

    const postError = makeWidget({
      list: {data: [{handle: 'a', change: 1}]},
      post: {error: 'Gone'},
    })
    await postError._updateGetData(postError.getUrl())
    expect(postError.error).toBe(true)
    expect(postError._errorMessage).toBe('Gone')
  })
})

import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {
  HistoryPoller,
  historyNotifications,
  MIN_DELAY,
  MAX_DELAY,
} from '../../src/historyPoller.js'

const txn = (id, name) => ({
  id,
  connection: {user: name === null ? null : {name, full_name: name}},
  changes: [{obj_class: 'Person', obj_handle: `h${id}`}],
})

// apiGet stub answering the user lookup with `me`, the baseline with
// `newestId`, and cursor polls from the `polls` queue (304 once empty).
function makeApiGet({newestId = 10, polls = []} = {}) {
  return vi.fn(async (endpoint, options) => {
    if (endpoint === '/api/users/-/') return {data: {name: 'me'}}
    if (!endpoint.includes('after_id')) {
      return {data: newestId === null ? [] : [{id: newestId}]}
    }
    const next = polls.shift()
    if (next) return next
    return options.etag
      ? {notModified: true, etag: options.etag, total_count: '0'}
      : {data: [], etag: '"e"', total_count: '0'}
  })
}

const cursorCalls = apiGet =>
  apiGet.mock.calls.filter(([endpoint]) => endpoint.includes('after_id'))

describe('HistoryPoller', () => {
  let events
  const listener = e => events.push(e.detail)
  let visibility

  beforeEach(() => {
    vi.useFakeTimers()
    events = []
    visibility = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
      () => visibility
    )
    window.addEventListener('history:changed', listener)
  })

  afterEach(() => {
    window.removeEventListener('history:changed', listener)
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts from the newest transaction without reporting it', async () => {
    const apiGet = makeApiGet({newestId: 10})
    const poller = new HistoryPoller(apiGet)
    poller.start()
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    expect(events).to.deep.equal([])
    const [[url, options]] = cursorCalls(apiGet)
    expect(url).to.equal(
      '/api/transactions/history/?page=1&pagesize=20&sort=-id&after_id=10'
    )
    expect(options).to.deep.equal({background: true, etag: null})
    poller.stop()
  })

  it('starts from 0 on an empty history', async () => {
    const apiGet = makeApiGet({newestId: null})
    const poller = new HistoryPoller(apiGet)
    poller.start()
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    expect(cursorCalls(apiGet)[0][0]).to.match(/after_id=0$/)
    poller.stop()
  })

  it("reports other users' transactions and skips the user's own", async () => {
    const apiGet = makeApiGet({
      polls: [
        {
          data: [txn(13, 'anna'), txn(12, 'me'), txn(11, null)],
          etag: '"a"',
          total_count: '3',
        },
      ],
    })
    const poller = new HistoryPoller(apiGet)
    poller.start()
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    expect(events).to.have.length(1)
    expect(events[0].total).to.equal(3)
    expect(events[0].transactions.map(t => t.id)).to.deep.equal([13, 11])
    // the cursor moves past all of them, including the user's own
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    expect(cursorCalls(apiGet)[1][0]).to.match(/after_id=13$/)
    poller.stop()
  })

  it('matches the user by id where the backend sends it', async () => {
    const withId = (id, userId, name) => ({
      id,
      connection: {user: {id: userId, name, full_name: name}},
    })
    const apiGet = makeApiGet({
      polls: [
        {
          // same name as the user but another id, and the reverse
          data: [withId(12, 'u-2', 'me'), withId(11, 'u-1', 'renamed')],
          etag: '"a"',
          total_count: '2',
        },
      ],
    })
    const poller = new HistoryPoller(apiGet, () => 'u-1')
    poller.start()
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    expect(events[0].transactions.map(t => t.id)).to.deep.equal([12])
    poller.stop()
  })

  it('keeps polling when a poll throws', async () => {
    const inner = makeApiGet()
    let thrown = false
    const apiGet = vi.fn((endpoint, options) => {
      if (endpoint.includes('after_id') && !thrown) {
        thrown = true
        return Promise.reject(new Error('boom'))
      }
      return inner(endpoint, options)
    })
    const poller = new HistoryPoller(apiGet)
    poller.start()
    await vi.advanceTimersByTimeAsync(MIN_DELAY + 2 * MIN_DELAY)
    expect(cursorCalls(apiGet)).to.have.length(2)
    poller.stop()
  })

  it('fires nothing when only the user changed something', async () => {
    const apiGet = makeApiGet({
      polls: [{data: [txn(11, 'me')], etag: '"a"', total_count: '1'}],
    })
    const poller = new HistoryPoller(apiGet)
    poller.start()
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    expect(events).to.deep.equal([])
    poller.stop()
  })

  it('sends the ETag only for the URL it came from', async () => {
    const apiGet = makeApiGet({
      polls: [{data: [txn(11, 'anna')], etag: '"a"', total_count: '1'}],
    })
    const poller = new HistoryPoller(apiGet)
    poller.start()
    // poll 1: new data; poll 2: new URL, no ETag; poll 3: ETag of poll 2
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    const etags = cursorCalls(apiGet).map(([, options]) => options.etag)
    expect(etags).to.deep.equal([null, null, '"e"'])
    poller.stop()
  })

  it('backs off while nothing changes, up to the maximum', async () => {
    const apiGet = makeApiGet()
    const poller = new HistoryPoller(apiGet)
    poller.start()
    // first cursor poll collects the ETag, so the delay stays at MIN_DELAY
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    expect(cursorCalls(apiGet)).to.have.length(2)
    // then 2x, 4x, ... capped at MAX_DELAY
    await vi.advanceTimersByTimeAsync(2 * MIN_DELAY - 1)
    expect(cursorCalls(apiGet)).to.have.length(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(cursorCalls(apiGet)).to.have.length(3)
    await vi.advanceTimersByTimeAsync(10 * MAX_DELAY)
    const count = cursorCalls(apiGet).length
    await vi.advanceTimersByTimeAsync(MAX_DELAY)
    expect(cursorCalls(apiGet)).to.have.length(count + 1)
    poller.stop()
  })

  it('resets the delay when new transactions arrive', async () => {
    const polls = []
    const apiGet = makeApiGet({polls})
    const poller = new HistoryPoller(apiGet)
    poller.start()
    await vi.advanceTimersByTimeAsync(10 * MAX_DELAY)
    polls.push({data: [txn(11, 'anna')], etag: '"a"', total_count: '1'})
    await vi.advanceTimersByTimeAsync(MAX_DELAY)
    expect(events).to.have.length(1)
    const count = cursorCalls(apiGet).length
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    expect(cursorCalls(apiGet)).to.have.length(count + 1)
    poller.stop()
  })

  it('pauses while hidden and polls at once when visible again', async () => {
    const apiGet = makeApiGet()
    const poller = new HistoryPoller(apiGet)
    poller.start()
    await vi.advanceTimersByTimeAsync(0)
    visibility = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(10 * MAX_DELAY)
    expect(cursorCalls(apiGet)).to.have.length(0)
    visibility = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(cursorCalls(apiGet)).to.have.length(1)
    poller.stop()
  })

  it('stops on a 403', async () => {
    const apiGet = makeApiGet({
      polls: [{error: 'Forbidden', errorDetail: {status: 403}}],
    })
    const poller = new HistoryPoller(apiGet)
    poller.start()
    await vi.advanceTimersByTimeAsync(10 * MAX_DELAY)
    expect(cursorCalls(apiGet)).to.have.length(1)
  })

  it('keeps polling after other errors', async () => {
    const apiGet = makeApiGet({
      polls: [{error: 'Network error', errorDetail: {}}],
    })
    const poller = new HistoryPoller(apiGet)
    poller.start()
    await vi.advanceTimersByTimeAsync(MIN_DELAY + 2 * MIN_DELAY)
    expect(cursorCalls(apiGet)).to.have.length(2)
    poller.stop()
  })

  it('retries the user lookup after an error', async () => {
    let fail = true
    const apiGet = vi.fn(async endpoint => {
      if (endpoint === '/api/users/-/') {
        if (fail) {
          fail = false
          return {error: 'Network error', errorDetail: {}}
        }
        return {data: {name: 'me'}}
      }
      return {data: [{id: 10}]}
    })
    const poller = new HistoryPoller(apiGet)
    poller.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(apiGet).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(2 * MIN_DELAY)
    expect(apiGet.mock.calls.map(([e]) => e)).to.deep.equal([
      '/api/users/-/',
      '/api/users/-/',
      '/api/transactions/history/?page=1&pagesize=1&sort=-id',
    ])
    poller.stop()
  })

  it('discards a response that arrives after stop', async () => {
    let resolvePoll
    const apiGet = makeApiGet()
    const poller = new HistoryPoller(apiGet)
    poller.start()
    await vi.advanceTimersByTimeAsync(0)
    apiGet.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolvePoll = resolve
        })
    )
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    poller.stop()
    resolvePoll({data: [txn(11, 'anna')], etag: '"a"', total_count: '1'})
    await vi.advanceTimersByTimeAsync(10 * MAX_DELAY)
    expect(events).to.deep.equal([])
    expect(cursorCalls(apiGet)).to.have.length(1)
  })

  it('stops polling on stop and can start again', async () => {
    const apiGet = makeApiGet()
    const poller = new HistoryPoller(apiGet)
    poller.start()
    await vi.advanceTimersByTimeAsync(0)
    poller.stop()
    await vi.advanceTimersByTimeAsync(10 * MAX_DELAY)
    expect(cursorCalls(apiGet)).to.have.length(0)
    poller.start()
    await vi.advanceTimersByTimeAsync(MIN_DELAY)
    expect(cursorCalls(apiGet)).to.have.length(1)
    poller.stop()
  })
})

describe('historyNotifications', () => {
  const change = (id, user, description = `Edit ${id}`) => ({
    id,
    description,
    connection: {user},
  })
  const anna = {name: 'anna', full_name: 'Anna Smith'}
  const bob = {name: 'bob', full_name: ''}

  it('describes and links a single transaction', () => {
    expect(
      historyNotifications([change(7, anna, 'Edit Person')])
    ).to.deep.equal([
      {
        type: 'info',
        source: 'history',
        message: 'Edit Person',
        detail: {transactionId: 7},
        userName: 'Anna Smith',
      },
    ])
  })

  it('counts several transactions of one user', () => {
    expect(
      historyNotifications([change(9, anna), change(8, anna), change(7, anna)])
    ).to.deep.equal([
      {
        type: 'info',
        source: 'history',
        message: '',
        detail: {count: 3},
        userName: 'Anna Smith',
      },
    ])
  })

  it('makes one notification per user, oldest first', () => {
    const result = historyNotifications([
      change(9, bob),
      change(8, anna),
      change(7, null),
      change(6, anna),
    ])
    expect(result.map(n => [n.userName, n.detail])).to.deep.equal([
      [null, {transactionId: 7}],
      ['Anna Smith', {count: 2}],
      ['bob', {transactionId: 9}],
    ])
  })

  it('groups by user id where the backend sends it', () => {
    const result = historyNotifications([
      change(9, {id: 'u-1', name: 'anna', full_name: 'Anna'}),
      change(8, {id: 'u-2', name: 'anna', full_name: 'Anna'}),
    ])
    expect(result).to.have.length(2)
  })

  it('returns nothing for no transactions', () => {
    expect(historyNotifications([])).to.deep.equal([])
  })
})

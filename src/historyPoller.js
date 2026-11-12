/* Polls the transaction history for changes made by other users and fires
`history:changed` on window with {transactions, total}. `transactions` holds
the new transactions of other users, newest first, at most PAGE_SIZE of them;
`total` is the number of new transactions including the user's own and those
beyond the first page.

The poll waits MIN_DELAY after new transactions and doubles the wait while
nothing changes, up to MAX_DELAY. It pauses while the tab is hidden and polls
as soon as the tab is visible again. A 403 stops it. */

import {fireEvent} from './util.js'

export const MIN_DELAY = 15 * 1000
export const MAX_DELAY = 120 * 1000
const PAGE_SIZE = 20
const HISTORY_URL = '/api/transactions/history/'

// The addNotification arguments announcing transactions of other users
// (newest first, as in `history:changed`), one notification per user. A
// single transaction is described and linked; several are counted. The
// result is oldest first, so adding it in order puts the newest on top.
// Transactions written by Gramps desktop have no user and form one group.
export function historyNotifications(transactions) {
  const groups = new Map()
  for (const txn of transactions) {
    const user = txn.connection?.user ?? null
    const key = user?.id ?? user?.name ?? null
    if (!groups.has(key)) groups.set(key, {user, transactions: []})
    groups.get(key).transactions.push(txn)
  }
  return [...groups.values()].reverse().map(({user, transactions: txns}) => {
    const [txn] = txns
    return {
      type: 'info',
      source: 'history',
      message: txns.length === 1 ? txn.description ?? '' : '',
      detail:
        txns.length === 1 ? {transactionId: txn.id} : {count: txns.length},
      userName: user?.full_name || user?.name || null,
    }
  })
}

export class HistoryPoller {
  // `apiGet` has the signature of appState.apiGet; `getUserId` returns the
  // id of the logged-in user.
  constructor(apiGet, getUserId = () => null) {
    this._apiGet = apiGet
    this._getUserId = getUserId
    this._running = false
    // Incremented on every stop, so a request that was in flight when the
    // poller stopped discards its result.
    this._generation = 0
    this._timer = null
    this._inFlight = false
    this._delay = MIN_DELAY
    this._ownName = null
    this._cursor = null
    this._url = ''
    this._etag = null
    this._handleVisibility = this._handleVisibility.bind(this)
  }

  start() {
    if (this._running) return
    this._running = true
    this._delay = MIN_DELAY
    document.addEventListener('visibilitychange', this._handleVisibility)
    this._poll()
  }

  stop() {
    if (!this._running) return
    this._running = false
    this._generation += 1
    this._inFlight = false
    clearTimeout(this._timer)
    this._timer = null
    document.removeEventListener('visibilitychange', this._handleVisibility)
    this._ownName = null
    this._cursor = null
    this._url = ''
    this._etag = null
  }

  _handleVisibility() {
    if (document.visibilityState === 'visible') {
      this._delay = MIN_DELAY
      this._poll()
    } else {
      clearTimeout(this._timer)
      this._timer = null
    }
  }

  _schedule() {
    clearTimeout(this._timer)
    this._timer = null
    if (!this._running || document.visibilityState === 'hidden') return
    this._timer = setTimeout(() => this._poll(), this._delay)
  }

  _backOff() {
    this._delay = Math.min(this._delay * 2, MAX_DELAY)
  }

  async _poll() {
    if (!this._running || this._inFlight) return
    clearTimeout(this._timer)
    this._timer = null
    this._inFlight = true
    const generation = this._generation
    let stopped = false
    try {
      stopped = await this._step(generation)
    } catch {
      this._backOff()
    } finally {
      if (generation === this._generation) {
        this._inFlight = false
      }
    }
    if (stopped) {
      this.stop()
    } else if (generation === this._generation) {
      this._schedule()
    }
  }

  // One poll. The first calls look up the user's own name and the newest
  // transaction id; after that, each call fetches what is newer than the
  // cursor. Returns true when polling should stop.
  async _step(generation) {
    if (this._ownName === null) {
      const res = await this._apiGet('/api/users/-/', {background: true})
      if (generation !== this._generation) return false
      if (!this._handleError(res)) return res.errorDetail?.status === 403
      this._ownName = res.data?.name ?? ''
    }
    if (this._cursor === null) {
      const res = await this._apiGet(
        `${HISTORY_URL}?page=1&pagesize=1&sort=-id`,
        {background: true}
      )
      if (generation !== this._generation) return false
      if (!this._handleError(res)) return res.errorDetail?.status === 403
      this._cursor = res.data?.[0]?.id ?? 0
      return false
    }
    const url = `${HISTORY_URL}?page=1&pagesize=${PAGE_SIZE}&sort=-id&after_id=${this._cursor}`
    // An ETag only validates the URL it came from.
    const etag = url === this._url ? this._etag : null
    const res = await this._apiGet(url, {background: true, etag})
    if (generation !== this._generation) return false
    if (!this._handleError(res)) return res.errorDetail?.status === 403
    this._url = url
    this._etag = res.etag ?? null
    if (res.notModified || !res.data?.length) {
      // The first request after the cursor moved has no ETag to send, so an
      // empty answer to it only collects the ETag and is not an idle poll.
      if (etag) this._backOff()
      return false
    }
    this._cursor = Math.max(this._cursor, ...res.data.map(txn => txn.id))
    this._delay = MIN_DELAY
    const transactions = res.data.filter(
      txn => !this._isOwn(txn.connection?.user)
    )
    if (transactions.length) {
      fireEvent(window, 'history:changed', {
        transactions,
        total: Number(res.total_count ?? res.data.length),
      })
    }
    return false
  }

  // Matches by user id where the backend sends it, by user name otherwise.
  // Transactions written by Gramps desktop have no user.
  _isOwn(user) {
    if (!user) return false
    if (user.id != null) return String(user.id) === String(this._getUserId())
    return user.name === this._ownName
  }

  // Returns true when `res` is usable; otherwise backs off.
  _handleError(res) {
    if (!('error' in res)) return true
    this._backOff()
    return false
  }
}

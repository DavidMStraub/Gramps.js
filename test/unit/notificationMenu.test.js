import {describe, it, expect, vi} from 'vitest'
import '../../src/components/GrampsjsNotificationMenu.js'

const makeMenu = (appState = {}) => {
  const element = document.createElement('grampsjs-notification-menu')
  element.appState = {i18n: {strings: {}}, ...appState}
  return element
}

const change = {
  id: 'a',
  source: 'history',
  type: 'info',
  message: 'Edit Person',
  detail: {transactionId: 42},
}
const exportDone = {
  id: 'b',
  source: 'task',
  type: 'success',
  message: 'Export',
  detail: {url: '/api/media/archive/def.zip'},
}
const apiError = {
  id: 'c',
  source: 'api',
  type: 'error',
  message: 'Boom',
  detail: {status: 500},
}

describe('notification menu', () => {
  it('links changes to their revision and details to the page', () => {
    const menu = makeMenu()
    expect(menu._itemHref(change)).toBe('/revision/42')
    expect(menu._itemHref(apiError)).toBe('/notifications')
    expect(menu._itemHref({...apiError, detail: {}})).toBe('')
  })

  it('downloads finished exports in place', () => {
    const menu = makeMenu()
    expect(menu._itemHref(exportDone)).toBe('')
  })

  it('marks everything read on opening and remembers what was unread', () => {
    const markAllRead = vi.fn()
    const loadActiveTasks = vi.fn()
    const menu = makeMenu({
      getNotifications: () => [
        {...change, read: false},
        {...apiError, read: true},
      ],
      markAllRead,
      loadActiveTasks,
    })

    menu._handleOpening()

    expect([...menu._unreadIds]).toEqual(['a'])
    expect(markAllRead).toHaveBeenCalled()
    expect(loadActiveTasks).toHaveBeenCalled()
  })

  it('counts running tasks in the badge when it appears', () => {
    const menu = makeMenu({
      getNotifications: () => [
        {...change, read: false},
        {...apiError, read: true},
      ],
      getActiveTasks: () => [
        {id: 't1', state: 'PROGRESS'},
        {id: 't2', state: 'SUCCESS'},
      ],
    })

    document.body.appendChild(menu)

    expect(menu._unreadCount).toBe(2)
    menu.remove()
  })

  it('opens the notifications page on small screens', () => {
    const menu = makeMenu({screenSize: 'small'})
    const nav = vi.fn()
    menu.addEventListener('nav', e => nav(e.detail))

    menu._handleClickBell()

    expect(nav).toHaveBeenCalledWith({path: 'notifications'})
  })
})

/*
Statuses and priorities of tasks, which are sources with the ToDo tag and
the attributes "Status" and "Priority"
*/

import {
  mdiAdjust,
  mdiCheckCircle,
  mdiChevronDoubleDown,
  mdiChevronDoubleUp,
  mdiHelp,
  mdiMinusCircle,
  mdiRadioboxBlank,
  mdiTimelapse,
} from '@mdi/js'

export const TASK_STATUSES = ['Open', 'In Progress', 'Blocked', 'Done']

// the values the app sets; any number below 5 counts as high and any number
// above as low
export const TASK_PRIORITIES = [
  {label: 'High', value: '1'},
  {label: 'Medium', value: '5'},
  {label: 'Low', value: '9'},
]

// icons of the statuses and priority labels, as {path, color}
export const STATUS_ICONS = {
  Open: {path: mdiRadioboxBlank, color: 'var(--grampsjs-task-open)'},
  'In Progress': {path: mdiTimelapse, color: 'var(--grampsjs-task-progress)'},
  Blocked: {
    path: mdiMinusCircle,
    color: 'var(--grampsjs-alert-error-font-color)',
  },
  Done: {path: mdiCheckCircle, color: 'var(--grampsjs-task-done)'},
}

export const PRIORITY_ICONS = {
  High: {
    path: mdiChevronDoubleUp,
    color: 'var(--grampsjs-alert-error-font-color)',
  },
  Medium: {path: mdiAdjust},
  Low: {
    path: mdiChevronDoubleDown,
    color: 'var(--grampsjs-alert-success-font-color)',
  },
}

// The icon of a status, also of one outside TASK_STATUSES. Done tasks fade
// in the list; elsewhere, e.g. as an option in a menu, `solid` keeps the
// icon in full color.
export function statusIcon(status, {solid = false} = {}) {
  if (status === 'Done' && solid) {
    return {...STATUS_ICONS.Done, color: 'var(--grampsjs-task-done-solid)'}
  }
  return STATUS_ICONS[status] ?? {path: mdiHelp}
}

export function taskAttribute(task, type) {
  return task?.attribute_list?.find(att => att.type === type)?.value
}

// The description of a task: the first note in its note list that exists,
// or undefined. Needs the task's extended notes.
export function taskNote(task) {
  const notes = task?.extended?.notes ?? []
  return (task?.note_list ?? [])
    .map(handle => notes.find(note => note?.handle === handle))
    .find(Boolean)
}

// 'High', 'Medium', 'Low', or '' for a missing or non-numeric priority
export function priorityLabel(priority) {
  if (priority === undefined || priority === null || priority === '') {
    return ''
  }
  const value = Number(priority)
  if (Number.isNaN(value)) {
    return ''
  }
  if (value < 5) {
    return 'High'
  }
  return value === 5 ? 'Medium' : 'Low'
}

// order of the statuses in the list; any other status comes before Done
const STATUS_ORDER = {Open: 1, 'In Progress': 2, Blocked: 3, Done: 5}
const OTHER_STATUS = 4

// Gramps priorities run from 0 to 9, so this sorts after all of them
const NO_PRIORITY = 10

function statusRank(task) {
  return STATUS_ORDER[taskAttribute(task, 'Status')] ?? OTHER_STATUS
}

function priorityRank(task) {
  const priority = taskAttribute(task, 'Priority')
  return priorityLabel(priority) ? Number(priority) : NO_PRIORITY
}

const byStatus = (a, b) => statusRank(a) - statusRank(b)
const byPriority = (a, b) => priorityRank(a) - priorityRank(b)

// the orders of the task list, by key, with their labels; Last changed
// shows the newest first
export const TASK_SORT_ORDERS = {
  status: {
    label: 'Status',
    compare: (a, b) => byStatus(a, b) || byPriority(a, b),
  },
  priority: {
    label: 'Priority',
    compare: (a, b) => byPriority(a, b) || byStatus(a, b),
  },
  title: {
    label: 'Title',
    compare: (a, b, locale) =>
      (a.title ?? '').localeCompare(b.title ?? '', locale),
  },
  change: {
    label: 'Last changed',
    compare: (a, b) => (b.change ?? 0) - (a.change ?? 0),
  },
}

// Sorts by one of TASK_SORT_ORDERS, by status and then with the highest
// priority first by default. The sort is stable, so tasks that tie keep
// their order.
export function sortTasks(tasks, key = 'status', locale = undefined) {
  const {compare} = TASK_SORT_ORDERS[key] ?? TASK_SORT_ORDERS.status
  return [...tasks].sort((a, b) => compare(a, b, locale))
}

// Filter sections of the task list, which filter the loaded tasks. Their
// rules are {name: 'Status' | 'Priority', values: [label]}.
export function taskStatusFilter(_) {
  return {
    id: 'taskStatus',
    label: _('Status'),
    pillLabel: _('Status'),
    editor: 'checkboxes',
    local: true,
    entries: TASK_STATUSES.map(status => ({
      label: _(status),
      rule: {name: 'Status', values: [status]},
    })),
  }
}

export function taskPriorityFilter(_) {
  return {
    id: 'taskPriority',
    label: _('Priority'),
    pillLabel: _('Priority'),
    editor: 'checkboxes',
    local: true,
    entries: TASK_PRIORITIES.map(({label}) => ({
      label: _(label),
      rule: {name: 'Priority', values: [label]},
    })),
  }
}

function ruleValues(rules, name) {
  return rules.filter(rule => rule.name === name).map(rule => rule.values[0])
}

// The tasks with any of the filtered statuses and any of the filtered
// priorities
export function filterTasks(tasks, rules) {
  const statuses = ruleValues(rules, 'Status')
  const priorities = ruleValues(rules, 'Priority')
  return tasks.filter(
    task =>
      (statuses.length === 0 ||
        statuses.includes(taskAttribute(task, 'Status'))) &&
      (priorities.length === 0 ||
        priorities.includes(priorityLabel(taskAttribute(task, 'Priority'))))
  )
}

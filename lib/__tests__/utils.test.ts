import { describe, it, expect } from 'vitest'
import {
  formatTimerDisplay,
  computeTimerMinutes,
  computeEffectiveMinutes,
  canSubmitEntry,
  handleChipSelectLogic,
  handleCustomMinutesLogic,
  formatDateLabel,
  getDateKey,
  formatTime,
  groupEntriesByDate,
  calculateKpis,
  calculateCategoryBreakdown,
  calculateTopSubtask,
  getInitials,
  TIME_CHIPS,
} from '../utils'

// ─── Timer Display Formatting ─────────────────────────────────

describe('formatTimerDisplay', () => {
  it('formats zero seconds as 00:00', () => {
    expect(formatTimerDisplay(0)).toBe('00:00')
  })

  it('formats seconds under a minute', () => {
    expect(formatTimerDisplay(5)).toBe('00:05')
    expect(formatTimerDisplay(59)).toBe('00:59')
  })

  it('formats exact minutes', () => {
    expect(formatTimerDisplay(60)).toBe('01:00')
    expect(formatTimerDisplay(300)).toBe('05:00')
  })

  it('formats minutes and seconds', () => {
    expect(formatTimerDisplay(90)).toBe('01:30')
    expect(formatTimerDisplay(754)).toBe('12:34')
  })

  it('handles large values', () => {
    expect(formatTimerDisplay(3600)).toBe('60:00')
    expect(formatTimerDisplay(5999)).toBe('99:59')
  })
})

// ─── Timer Minutes Calculation ────────────────────────────────

describe('computeTimerMinutes', () => {
  it('returns 0 for 0 seconds', () => {
    expect(computeTimerMinutes(0)).toBe(0)
  })

  it('rounds up partial minutes', () => {
    expect(computeTimerMinutes(1)).toBe(1)
    expect(computeTimerMinutes(30)).toBe(1)
    expect(computeTimerMinutes(59)).toBe(1)
  })

  it('returns exact minutes for full minutes', () => {
    expect(computeTimerMinutes(60)).toBe(1)
    expect(computeTimerMinutes(120)).toBe(2)
  })

  it('rounds up 61 seconds to 2 minutes', () => {
    expect(computeTimerMinutes(61)).toBe(2)
  })
})

// ─── Effective Minutes ────────────────────────────────────────

describe('computeEffectiveMinutes', () => {
  it('returns chip value in quick mode when chip is selected', () => {
    expect(computeEffectiveMinutes('quick', 15, '', 0)).toBe(15)
  })

  it('returns custom minutes in quick mode when no chip selected', () => {
    expect(computeEffectiveMinutes('quick', null, '25', 0)).toBe(25)
  })

  it('returns 0 in quick mode when nothing selected', () => {
    expect(computeEffectiveMinutes('quick', null, '', 0)).toBe(0)
  })

  it('prefers chip over custom when both present', () => {
    expect(computeEffectiveMinutes('quick', 10, '25', 0)).toBe(10)
  })

  it('returns timer minutes in timer mode', () => {
    expect(computeEffectiveMinutes('timer', null, '', 90)).toBe(2)
    expect(computeEffectiveMinutes('timer', 15, '15', 90)).toBe(2)
  })
})

// ─── Can Submit Entry ─────────────────────────────────────────

describe('canSubmitEntry', () => {
  it('returns true when minutes > 0 and timer not running', () => {
    expect(canSubmitEntry(15, false)).toBe(true)
  })

  it('returns false when minutes is 0', () => {
    expect(canSubmitEntry(0, false)).toBe(false)
  })

  it('returns false when timer is running', () => {
    expect(canSubmitEntry(15, true)).toBe(false)
  })

  it('returns false when both 0 minutes and timer running', () => {
    expect(canSubmitEntry(0, true)).toBe(false)
  })
})

// ─── Chip Selection Logic ─────────────────────────────────────

describe('handleChipSelectLogic', () => {
  it('selects a chip and syncs custom minutes', () => {
    const result = handleChipSelectLogic(15, null)
    expect(result.selectedChip).toBe(15)
    expect(result.customMinutes).toBe('15')
  })

  it('deselects when tapping the already-selected chip', () => {
    const result = handleChipSelectLogic(15, 15)
    expect(result.selectedChip).toBeNull()
    expect(result.customMinutes).toBe('')
  })

  it('switches to a different chip', () => {
    const result = handleChipSelectLogic(30, 15)
    expect(result.selectedChip).toBe(30)
    expect(result.customMinutes).toBe('30')
  })
})

describe('handleCustomMinutesLogic', () => {
  it('strips non-digit characters', () => {
    const result = handleCustomMinutesLogic('1a2b3')
    expect(result.customMinutes).toBe('123')
    expect(result.selectedChip).toBeNull()
  })

  it('auto-selects chip when custom value matches a chip', () => {
    const result = handleCustomMinutesLogic('15')
    expect(result.customMinutes).toBe('15')
    expect(result.selectedChip).toBe(15)
  })

  it('clears chip when custom value does not match', () => {
    const result = handleCustomMinutesLogic('25')
    expect(result.customMinutes).toBe('25')
    expect(result.selectedChip).toBeNull()
  })

  it('handles empty string', () => {
    const result = handleCustomMinutesLogic('')
    expect(result.customMinutes).toBe('')
    expect(result.selectedChip).toBeNull()
  })
})

// ─── Date Formatting & Grouping ──────────────────────────────

describe('getDateKey', () => {
  it('extracts YYYY-MM-DD from ISO timestamp', () => {
    const key = getDateKey('2026-02-17T14:30:00.000Z')
    // The exact output depends on local timezone, but format should be YYYY-MM-DD
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('pads single-digit month and day', () => {
    // January 5 in local timezone
    const key = getDateKey('2026-01-05T12:00:00.000Z')
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    // Verify zero-padding is present
    expect(key.split('-')[1].length).toBe(2)
    expect(key.split('-')[2].length).toBe(2)
  })
})

describe('formatDateLabel', () => {
  it('returns "Today" for today\'s date', () => {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(formatDateLabel(todayStr)).toBe('Today')
  })

  it('returns "Yesterday" for yesterday\'s date', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    expect(formatDateLabel(yStr)).toBe('Yesterday')
  })

  it('returns formatted date for older dates', () => {
    // Use a fixed past date that's never today/yesterday
    const label = formatDateLabel('2025-01-15')
    expect(label).toBe('Wed, Jan 15')
  })
})

describe('formatTime', () => {
  it('formats morning time in 12h format', () => {
    // Create a date string in local timezone for 9:05 AM
    const date = new Date(2026, 1, 17, 9, 5, 0)
    const result = formatTime(date.toISOString())
    expect(result).toBe('9:05 AM')
  })

  it('formats noon as 12:00 PM', () => {
    const date = new Date(2026, 1, 17, 12, 0, 0)
    const result = formatTime(date.toISOString())
    expect(result).toBe('12:00 PM')
  })

  it('formats midnight as 12:00 AM', () => {
    const date = new Date(2026, 1, 17, 0, 0, 0)
    const result = formatTime(date.toISOString())
    expect(result).toBe('12:00 AM')
  })

  it('formats afternoon time', () => {
    const date = new Date(2026, 1, 17, 14, 35, 0)
    const result = formatTime(date.toISOString())
    expect(result).toBe('2:35 PM')
  })
})

describe('groupEntriesByDate', () => {
  const makeEntry = (date: Date, minutes: number) => ({
    created_at: date.toISOString(),
    minutes,
  })

  it('returns empty array for empty input', () => {
    expect(groupEntriesByDate([])).toEqual([])
  })

  it('groups entries from same day together', () => {
    const date = new Date(2026, 1, 17, 10, 0, 0)
    const entries = [
      makeEntry(date, 15),
      makeEntry(new Date(2026, 1, 17, 14, 0, 0), 30),
    ]
    const groups = groupEntriesByDate(entries)
    expect(groups).toHaveLength(1)
    expect(groups[0].entries).toHaveLength(2)
    expect(groups[0].totalMinutes).toBe(45)
  })

  it('separates entries from different days', () => {
    const entries = [
      makeEntry(new Date(2026, 1, 17, 10, 0), 15),
      makeEntry(new Date(2026, 1, 16, 10, 0), 30),
    ]
    const groups = groupEntriesByDate(entries)
    expect(groups).toHaveLength(2)
  })

  it('calculates totalMinutes correctly per group', () => {
    const entries = [
      makeEntry(new Date(2025, 0, 15, 10, 0), 10),
      makeEntry(new Date(2025, 0, 15, 11, 0), 20),
      makeEntry(new Date(2025, 0, 15, 12, 0), 30),
    ]
    const groups = groupEntriesByDate(entries)
    expect(groups[0].totalMinutes).toBe(60)
  })
})

// ─── KPI Calculations ────────────────────────────────────────

describe('calculateKpis', () => {
  it('returns zeros for empty entries', () => {
    const result = calculateKpis([])
    expect(result).toEqual({ totalMinutes: 0, hoursPerWeek: 0, totalEntries: 0, totalOccurrences: 0 })
  })

  it('sums minutes and occurrences', () => {
    const entries = [
      { minutes: 10, occurrences: 2, created_at: '2026-02-17T10:00:00Z' },
      { minutes: 20, occurrences: 3, created_at: '2026-02-17T11:00:00Z' },
    ]
    const result = calculateKpis(entries)
    expect(result.totalMinutes).toBe(30)
    expect(result.totalEntries).toBe(2)
    expect(result.totalOccurrences).toBe(5)
  })

  it('calculates hours per week with minimum 1 week span', () => {
    // All entries on same day → weekSpan = 1
    const entries = [
      { minutes: 60, occurrences: 1, created_at: '2026-02-17T10:00:00Z' },
      { minutes: 60, occurrences: 1, created_at: '2026-02-17T14:00:00Z' },
    ]
    const result = calculateKpis(entries)
    // 120 minutes / 60 / 1 week = 2.0 hours/week
    expect(result.hoursPerWeek).toBe(2)
  })
})

// ─── Category Breakdown ──────────────────────────────────────

describe('calculateCategoryBreakdown', () => {
  const makeEntry = (catId: string, catLabel: string, minutes: number) => ({
    category_id: catId,
    subtask_id: `sub-${catId}`,
    minutes,
    categories: { label: catLabel, icon: '📋' },
    subtasks: { label: 'Sub' },
  })

  it('returns empty array for empty input', () => {
    expect(calculateCategoryBreakdown([])).toEqual([])
  })

  it('aggregates minutes per category', () => {
    const entries = [
      makeEntry('cat1', 'Dwell', 10),
      makeEntry('cat1', 'Dwell', 20),
      makeEntry('cat2', 'Routing', 15),
    ]
    const result = calculateCategoryBreakdown(entries)
    expect(result).toHaveLength(2)
    expect(result[0].label).toBe('Dwell')
    expect(result[0].totalMinutes).toBe(30)
    expect(result[1].label).toBe('Routing')
    expect(result[1].totalMinutes).toBe(15)
  })

  it('sorts by totalMinutes descending', () => {
    const entries = [
      makeEntry('cat1', 'Small', 5),
      makeEntry('cat2', 'Big', 50),
      makeEntry('cat3', 'Medium', 25),
    ]
    const result = calculateCategoryBreakdown(entries)
    expect(result[0].label).toBe('Big')
    expect(result[1].label).toBe('Medium')
    expect(result[2].label).toBe('Small')
  })

  it('sets percentage relative to max category', () => {
    const entries = [
      makeEntry('cat1', 'Max', 100),
      makeEntry('cat2', 'Half', 50),
    ]
    const result = calculateCategoryBreakdown(entries)
    expect(result[0].percentage).toBe(100)
    expect(result[1].percentage).toBe(50)
  })

  it('uses fallback label and icon for null categories', () => {
    const entries = [{
      category_id: 'cat1',
      subtask_id: 'sub1',
      minutes: 10,
      categories: null,
      subtasks: null,
    }]
    const result = calculateCategoryBreakdown(entries)
    expect(result[0].label).toBe('Unknown')
    expect(result[0].icon).toBe('📌')
  })
})

// ─── Top Subtask / Automation Opportunity ────────────────────

describe('calculateTopSubtask', () => {
  const makeEntry = (subtaskId: string, subtaskLabel: string, catLabel: string, minutes: number) => ({
    category_id: `cat-${subtaskId}`,
    subtask_id: subtaskId,
    minutes,
    categories: { label: catLabel, icon: '📋' },
    subtasks: { label: subtaskLabel },
  })

  it('returns null for empty entries', () => {
    expect(calculateTopSubtask([])).toBeNull()
  })

  it('identifies the subtask with highest total minutes', () => {
    const entries = [
      makeEntry('s1', 'SubA', 'CatA', 10),
      makeEntry('s1', 'SubA', 'CatA', 20),
      makeEntry('s2', 'SubB', 'CatB', 25),
    ]
    const result = calculateTopSubtask(entries)
    expect(result).not.toBeNull()
    expect(result!.subtaskLabel).toBe('SubA')
    expect(result!.totalMinutes).toBe(30)
  })

  it('calculates monthly savings as totalMinutes * 4.3 rounded', () => {
    const entries = [
      makeEntry('s1', 'SubA', 'CatA', 100),
    ]
    const result = calculateTopSubtask(entries)
    expect(result!.monthlySavings).toBe(Math.round(100 * 4.3))
    expect(result!.monthlySavings).toBe(430)
  })
})

// ─── Name Initials ────────────────────────────────────────────

describe('getInitials', () => {
  it('returns single uppercase letter for single name', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  it('returns first and last initials for two names', () => {
    expect(getInitials('John Smith')).toBe('JS')
  })

  it('handles three or more names (uses first and last)', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MW')
  })

  it('trims whitespace', () => {
    expect(getInitials('  Bob Lee  ')).toBe('BL')
  })

  it('handles lowercase input', () => {
    expect(getInitials('alice bob')).toBe('AB')
  })
})

// ─── TIME_CHIPS constant ─────────────────────────────────────

describe('TIME_CHIPS', () => {
  it('contains the expected preset values', () => {
    expect([...TIME_CHIPS]).toEqual([5, 10, 15, 20, 30, 45, 60])
  })
})

/**
 * Shared utility functions extracted from page components for testability.
 */

// ─── Time Formatting ──────────────────────────────────────────

export const TIME_CHIPS = [5, 10, 15, 20, 30, 45, 60] as const

export function formatTimerDisplay(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function computeTimerMinutes(timerSeconds: number): number {
  return Math.ceil(timerSeconds / 60)
}

export function computeEffectiveMinutes(
  entryMode: 'quick' | 'timer',
  selectedChip: number | null,
  customMinutes: string,
  timerSeconds: number
): number {
  if (entryMode === 'quick') {
    return selectedChip ?? (customMinutes ? parseInt(customMinutes, 10) : 0)
  }
  return computeTimerMinutes(timerSeconds)
}

export function canSubmitEntry(effectiveMinutes: number, timerRunning: boolean): boolean {
  return effectiveMinutes > 0 && !timerRunning
}

// ─── Chip Selection Logic ─────────────────────────────────────

export function handleChipSelectLogic(
  minutes: number,
  currentChip: number | null
): { selectedChip: number | null; customMinutes: string } {
  if (currentChip === minutes) {
    return { selectedChip: null, customMinutes: '' }
  }
  return { selectedChip: minutes, customMinutes: String(minutes) }
}

export function handleCustomMinutesLogic(
  value: string
): { customMinutes: string; selectedChip: number | null } {
  const cleaned = value.replace(/\D/g, '')
  const num = parseInt(cleaned, 10)
  if (TIME_CHIPS.includes(num as typeof TIME_CHIPS[number])) {
    return { customMinutes: cleaned, selectedChip: num }
  }
  return { customMinutes: cleaned, selectedChip: null }
}

// ─── Date Grouping & Formatting ──────────────────────────────

export function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (target.getTime() === today.getTime()) return 'Today'
  if (target.getTime() === yesterday.getTime()) return 'Yesterday'

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
}

export function getDateKey(createdAt: string): string {
  const date = new Date(createdAt)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function formatTime(createdAt: string): string {
  const date = new Date(createdAt)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`
}

type EntryWithDateAndMinutes = { created_at: string; minutes: number }

export type DateGroup<T extends EntryWithDateAndMinutes> = {
  label: string
  totalMinutes: number
  entries: T[]
}

export function groupEntriesByDate<T extends EntryWithDateAndMinutes>(entries: T[]): DateGroup<T>[] {
  const groups = new Map<string, T[]>()

  for (const entry of entries) {
    const key = getDateKey(entry.created_at)
    const existing = groups.get(key)
    if (existing) {
      existing.push(entry)
    } else {
      groups.set(key, [entry])
    }
  }

  return Array.from(groups.entries()).map(([dateKey, groupEntries]) => ({
    label: formatDateLabel(dateKey),
    totalMinutes: groupEntries.reduce((sum, e) => sum + e.minutes, 0),
    entries: groupEntries,
  }))
}

// ─── KPI / Insights Calculations ─────────────────────────────

type EntryForKpi = { minutes: number; occurrences: number; created_at: string }

export type KpiData = {
  totalMinutes: number
  hoursPerWeek: number
  totalEntries: number
  totalOccurrences: number
}

export function calculateKpis(entries: EntryForKpi[]): KpiData {
  if (entries.length === 0) {
    return { totalMinutes: 0, hoursPerWeek: 0, totalEntries: 0, totalOccurrences: 0 }
  }

  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0)
  const totalEntries = entries.length
  const totalOccurrences = entries.reduce((sum, e) => sum + e.occurrences, 0)

  const timestamps = entries.map((e) => new Date(e.created_at).getTime())
  const earliest = Math.min(...timestamps)
  const latest = Math.max(...timestamps)
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weekSpan = Math.max((latest - earliest) / msPerWeek, 1)
  const hoursPerWeek = Math.round((totalMinutes / 60 / weekSpan) * 10) / 10

  return { totalMinutes, hoursPerWeek, totalEntries, totalOccurrences }
}

type EntryForCategory = {
  category_id: string
  subtask_id: string
  minutes: number
  categories: { label: string; icon: string } | null
  subtasks: { label: string } | null
}

export type CategoryBreakdown = {
  categoryId: string
  label: string
  icon: string
  totalMinutes: number
  percentage: number
}

export function calculateCategoryBreakdown(entries: EntryForCategory[]): CategoryBreakdown[] {
  const categoryMap = new Map<string, { label: string; icon: string; totalMinutes: number }>()

  for (const entry of entries) {
    const existing = categoryMap.get(entry.category_id)
    if (existing) {
      existing.totalMinutes += entry.minutes
    } else {
      categoryMap.set(entry.category_id, {
        label: entry.categories?.label ?? 'Unknown',
        icon: entry.categories?.icon ?? '📌',
        totalMinutes: entry.minutes,
      })
    }
  }

  const sorted = Array.from(categoryMap.entries())
    .map(([categoryId, data]) => ({ categoryId, ...data, percentage: 0 }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes)

  const maxMinutes = sorted[0]?.totalMinutes ?? 1

  return sorted.map((item) => ({
    ...item,
    percentage: Math.round((item.totalMinutes / maxMinutes) * 100),
  }))
}

export type TopSubtask = {
  subtaskLabel: string
  categoryLabel: string
  categoryIcon: string
  totalMinutes: number
  monthlySavings: number
}

export function calculateTopSubtask(entries: EntryForCategory[]): TopSubtask | null {
  if (entries.length === 0) return null

  const subtaskMap = new Map<string, { subtaskLabel: string; categoryLabel: string; categoryIcon: string; totalMinutes: number }>()

  for (const entry of entries) {
    const existing = subtaskMap.get(entry.subtask_id)
    if (existing) {
      existing.totalMinutes += entry.minutes
    } else {
      subtaskMap.set(entry.subtask_id, {
        subtaskLabel: entry.subtasks?.label ?? 'Unknown',
        categoryLabel: entry.categories?.label ?? 'Unknown',
        categoryIcon: entry.categories?.icon ?? '📌',
        totalMinutes: entry.minutes,
      })
    }
  }

  let top: TopSubtask | null = null
  for (const data of subtaskMap.values()) {
    if (!top || data.totalMinutes > top.totalMinutes) {
      top = { ...data, monthlySavings: Math.round(data.totalMinutes * 4.3) }
    }
  }

  return top
}

// ─── Name Initials ────────────────────────────────────────────

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

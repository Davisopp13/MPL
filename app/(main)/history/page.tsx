'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LogEntry } from '@/types/database'

type LogEntryWithRelations = LogEntry & {
  categories: { label: string; icon: string }
  subtasks: { label: string }
}

type DateGroup = {
  label: string
  totalMinutes: number
  entries: LogEntryWithRelations[]
}

function formatDateLabel(dateStr: string): string {
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

function getDateKey(createdAt: string): string {
  const date = new Date(createdAt)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatTime(createdAt: string): string {
  const date = new Date(createdAt)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`
}

function groupEntriesByDate(entries: LogEntryWithRelations[]): DateGroup[] {
  const groups = new Map<string, LogEntryWithRelations[]>()

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

export default function HistoryPage() {
  const [entries, setEntries] = useState<LogEntryWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEntries() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error: fetchError } = await supabase
        .from('log_entries')
        .select('*, categories(label, icon), subtasks(label)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError('Failed to load history')
        setLoading(false)
        return
      }

      setEntries((data as LogEntryWithRelations[]) ?? [])
      setLoading(false)
    }

    fetchEntries()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Summary card skeleton */}
        <div className="h-28 animate-pulse rounded-2xl bg-gradient-to-br from-mpl-primary/20 to-mpl-primary-dark/20" />
        {/* Date group header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        </div>
        {/* Entry card skeletons */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-mpl-border bg-mpl-surface p-3"
          >
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-6 w-12 shrink-0 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-2xl">⚠️</p>
        <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>
        <button
          onClick={() => {
            setError(null)
            setLoading(true)
            window.location.reload()
          }}
          className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition-colors duration-150 active:scale-[0.97] hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-mpl-border bg-mpl-surface p-8 text-center">
        <p className="text-3xl">📋</p>
        <p className="mt-3 text-sm font-semibold text-slate-700">No entries yet</p>
        <p className="mt-1 text-xs text-slate-400">Start logging to see your history!</p>
      </div>
    )
  }

  const dateGroups = groupEntriesByDate(entries)

  // Calculate today's totals
  const todayKey = getDateKey(new Date().toISOString())
  const todayEntries = entries.filter((e) => getDateKey(e.created_at) === todayKey)
  const todayMinutes = todayEntries.reduce((sum, e) => sum + e.minutes, 0)
  const todayEntryCount = todayEntries.length
  const todayOccurrences = todayEntries.reduce((sum, e) => sum + e.occurrences, 0)

  return (
    <div className="space-y-6">
      {/* Today's Summary Card */}
      <div className="rounded-2xl bg-gradient-to-br from-mpl-primary to-mpl-primary-dark p-5 text-white">
        <p className="text-sm font-medium text-white/80">Today&apos;s Total</p>
        <p className="mt-1 text-4xl font-bold">{todayMinutes}m</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-white/70">📝</span>
            <span className="text-sm font-medium text-white/90">
              {todayEntryCount} {todayEntryCount === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-white/70">🔁</span>
            <span className="text-sm font-medium text-white/90">
              {todayOccurrences} {todayOccurrences === 1 ? 'occurrence' : 'occurrences'}
            </span>
          </div>
        </div>
      </div>

      {dateGroups.map((group) => (
        <div key={group.label}>
          {/* Date group header */}
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500">{group.label}</h2>
            <span className="text-sm font-bold text-mpl-primary">{group.totalMinutes}m total</span>
          </div>

          {/* Entry cards */}
          <div className="space-y-2">
            {group.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-xl border border-mpl-border bg-mpl-surface p-3"
              >
                {/* Category icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mpl-primary-light text-lg">
                  {entry.categories.icon}
                </div>

                {/* Entry details */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-800">
                      {entry.categories.label}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        entry.verified
                          ? 'bg-[#ECFDF5] text-[#065F46]'
                          : 'bg-[#FEF3C7] text-[#92400E]'
                      }`}
                    >
                      {entry.verified ? 'Timer' : 'Manual'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-mpl-primary">{entry.subtasks.label}</p>
                  {entry.note && (
                    <p className="mt-0.5 truncate text-xs text-slate-400">{entry.note}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                    <span>🕐 {formatTime(entry.created_at)}</span>
                    {entry.occurrences > 1 && (
                      <span>{entry.occurrences}x occurrences</span>
                    )}
                  </div>
                </div>

                {/* Minutes */}
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-mpl-primary">{entry.minutes}m</p>
                  {entry.occurrences > 1 && (
                    <p className="text-[11px] text-slate-400">
                      ~{Math.round(entry.minutes / entry.occurrences)}m/ea
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

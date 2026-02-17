'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LogEntry } from '@/types/database'

type LogEntryWithCategory = LogEntry & {
  categories: { label: string; icon: string } | null
  subtasks: { label: string } | null
}

type KpiData = {
  totalMinutes: number
  hoursPerWeek: number
  totalEntries: number
  totalOccurrences: number
}

type CategoryBreakdown = {
  categoryId: string
  label: string
  icon: string
  totalMinutes: number
  percentage: number
}

type TopSubtask = {
  subtaskLabel: string
  categoryLabel: string
  categoryIcon: string
  totalMinutes: number
  monthlySavings: number
}

function calculateKpis(entries: LogEntry[]): KpiData {
  if (entries.length === 0) {
    return { totalMinutes: 0, hoursPerWeek: 0, totalEntries: 0, totalOccurrences: 0 }
  }

  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0)
  const totalEntries = entries.length
  const totalOccurrences = entries.reduce((sum, e) => sum + e.occurrences, 0)

  // Calculate hours/week: find the date range of entries, then compute weekly average
  const timestamps = entries.map((e) => new Date(e.created_at).getTime())
  const earliest = Math.min(...timestamps)
  const latest = Math.max(...timestamps)
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weekSpan = Math.max((latest - earliest) / msPerWeek, 1)
  const hoursPerWeek = Math.round((totalMinutes / 60 / weekSpan) * 10) / 10

  return { totalMinutes, hoursPerWeek, totalEntries, totalOccurrences }
}

function calculateCategoryBreakdown(entries: LogEntryWithCategory[]): CategoryBreakdown[] {
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

function calculateTopSubtask(entries: LogEntryWithCategory[]): TopSubtask | null {
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

export default function InsightsPage() {
  const [entries, setEntries] = useState<LogEntryWithCategory[]>([])
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

      if (fetchError) {
        setError('Failed to load insights')
        setLoading(false)
        return
      }

      setEntries((data as LogEntryWithCategory[]) ?? [])
      setLoading(false)
    }

    fetchEntries()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* KPI card skeletons */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-mpl-border bg-mpl-surface p-4"
            >
              <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-3 h-7 w-16 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-3 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
        {/* Category breakdown skeleton */}
        <div className="rounded-2xl border border-mpl-border bg-mpl-surface p-4">
          <div className="mb-4 h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                  </div>
                  <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="h-2 animate-pulse rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
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
        <p className="text-3xl">📊</p>
        <p className="mt-3 text-sm font-semibold text-slate-700">No insights yet</p>
        <p className="mt-1 text-xs text-slate-400">Log entries to see insights</p>
      </div>
    )
  }

  const kpis = calculateKpis(entries)
  const categoryBreakdown = calculateCategoryBreakdown(entries)
  const totalMinutesAllCategories = entries.reduce((sum, e) => sum + e.minutes, 0)
  const topSubtask = calculateTopSubtask(entries)

  const cards = [
    {
      label: 'Total Minutes',
      value: kpis.totalMinutes.toLocaleString(),
      suffix: 'm',
      icon: '⏱️',
      bgColor: 'bg-[#E0F2FE]',
      textColor: 'text-[#0284C7]',
      iconBg: 'bg-[#BAE6FD]',
    },
    {
      label: 'Hours / Week',
      value: kpis.hoursPerWeek.toString(),
      suffix: 'h',
      icon: '📅',
      bgColor: 'bg-[#FEF3C7]',
      textColor: 'text-[#92400E]',
      iconBg: 'bg-[#FDE68A]',
    },
    {
      label: 'Total Entries',
      value: kpis.totalEntries.toLocaleString(),
      suffix: '',
      icon: '📝',
      bgColor: 'bg-[#ECFDF5]',
      textColor: 'text-[#065F46]',
      iconBg: 'bg-[#A7F3D0]',
    },
    {
      label: 'Total Occurrences',
      value: kpis.totalOccurrences.toLocaleString(),
      suffix: '',
      icon: '🔁',
      bgColor: 'bg-[#FEF2F2]',
      textColor: 'text-[#991B1B]',
      iconBg: 'bg-[#FECACA]',
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border border-mpl-border ${card.bgColor} p-4`}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg} text-sm`}>
              {card.icon}
            </div>
            <p className={`mt-3 text-2xl font-bold ${card.textColor}`}>
              {card.value}
              {card.suffix && <span className="text-lg">{card.suffix}</span>}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="rounded-2xl border border-mpl-border bg-mpl-surface p-4">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Time by Category</h2>
          <div className="space-y-4">
            {categoryBreakdown.map((cat) => {
              const catPercentOfTotal = totalMinutesAllCategories > 0
                ? Math.round((cat.totalMinutes / totalMinutesAllCategories) * 100)
                : 0
              return (
                <div key={cat.categoryId}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E0F2FE] text-sm">
                        {cat.icon}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{cat.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-mpl-primary">
                        {cat.totalMinutes.toLocaleString()}m
                      </span>
                      <span className="ml-1.5 text-xs text-slate-400">
                        {catPercentOfTotal}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-mpl-primary to-mpl-primary-dark transition-all duration-300"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Automation Opportunity Callout */}
      {topSubtask && (
        <div className="rounded-2xl border border-amber-200 bg-[#FEF3C7] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FDE68A] text-base">
              💡
            </span>
            <h2 className="text-sm font-semibold text-[#92400E]">Automation Opportunity</h2>
          </div>
          <p className="text-sm font-medium text-[#78350F]">
            {topSubtask.subtaskLabel}
          </p>
          <p className="mt-0.5 text-xs text-[#92400E]">
            {topSubtask.categoryIcon} {topSubtask.categoryLabel}
          </p>
          <div className="mt-3 flex items-baseline gap-4">
            <div>
              <p className="text-xl font-bold text-[#78350F]">
                {topSubtask.totalMinutes.toLocaleString()}m
              </p>
              <p className="text-xs text-[#92400E]">total logged</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#78350F]">
                ~{topSubtask.monthlySavings.toLocaleString()}m
              </p>
              <p className="text-xs text-[#92400E]">projected / month</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

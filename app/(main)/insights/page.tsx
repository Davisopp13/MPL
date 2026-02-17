'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LogEntry } from '@/types/database'

type KpiData = {
  totalMinutes: number
  hoursPerWeek: number
  totalEntries: number
  totalOccurrences: number
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

export default function InsightsPage() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEntries() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error: fetchError } = await supabase
        .from('log_entries')
        .select('*')
        .eq('user_id', user.id)

      if (fetchError) {
        setError('Failed to load insights')
        setLoading(false)
        return
      }

      setEntries((data as LogEntry[]) ?? [])
      setLoading(false)
    }

    fetchEntries()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-mpl-border bg-mpl-surface"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-mpl-border bg-mpl-surface p-6 text-center">
        <p className="text-2xl">📊</p>
        <p className="mt-2 text-sm font-semibold text-slate-700">No insights yet</p>
        <p className="mt-1 text-xs text-slate-400">Log entries to see insights</p>
      </div>
    )
  }

  const kpis = calculateKpis(entries)

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
    </div>
  )
}

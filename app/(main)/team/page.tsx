'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/database'
import { fetchTeamData, type MemberStats } from './actions'

type TeamFilter = 'All' | 'CH' | 'MH'
type DatePreset = 'this_week' | 'last_week' | 'this_month' | 'custom'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getWeekRange(offset = 0): { start: string; end: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday.toISOString(), end: sunday.toISOString() }
}

function getMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

function getDateRangeLabel(preset: DatePreset): string {
  switch (preset) {
    case 'this_week': return 'This Week'
    case 'last_week': return 'Last Week'
    case 'this_month': return 'This Month'
    case 'custom': return 'Custom'
  }
}

function getDateRangeForPreset(preset: DatePreset): { start: string; end: string } | undefined {
  switch (preset) {
    case 'this_week': return undefined // server action defaults to current week
    case 'last_week': return getWeekRange(-1)
    case 'this_month': return getMonthRange()
    case 'custom': return undefined
  }
}

export default function TeamPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [memberStats, setMemberStats] = useState<MemberStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<TeamFilter>('All')
  const [datePreset, setDatePreset] = useState<DatePreset>('this_week')

  const loadTeamData = useCallback(async (preset: DatePreset) => {
    setLoading(true)
    setError(null)

    const dateRange = getDateRangeForPreset(preset)
    const result = await fetchTeamData(dateRange)

    if (result.error && result.error !== 'Supervisor access required') {
      setError(result.error)
    }

    setMemberStats(result.members)
    setLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!profile) {
        setError('Failed to load profile')
        setLoading(false)
        return
      }

      setCurrentUser(profile)

      if (profile.role !== 'supervisor') {
        setLoading(false)
        return
      }

      await loadTeamData('this_week')
    }

    init()
  }, [loadTeamData])

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset)
    loadTeamData(preset)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl border border-mpl-border bg-mpl-surface" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 w-16 animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-mpl-border bg-mpl-surface" />
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

  // Member view — show read-only personal stats message
  if (!currentUser || currentUser.role !== 'supervisor') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-mpl-border bg-mpl-surface p-6 text-center">
          <p className="text-2xl">👥</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">Team View</p>
          <p className="mt-1 text-xs text-slate-400">
            This view is available for supervisors.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Check Insights for your personal stats.
          </p>
        </div>
      </div>
    )
  }

  // Supervisor view
  const filteredMembers = filter === 'All'
    ? memberStats
    : memberStats.filter((m) => m.team === filter)

  const weekTotalMinutes = filteredMembers.reduce((sum, m) => sum + m.totalMinutes, 0)
  const weekTotalHours = Math.round((weekTotalMinutes / 60) * 10) / 10

  return (
    <div className="space-y-4">
      {/* Team Aggregate Card */}
      <div className="rounded-2xl bg-gradient-to-br from-mpl-primary to-mpl-primary-dark p-5 text-white">
        <p className="text-xs font-medium text-white/70">{getDateRangeLabel(datePreset)}</p>
        <p className="mt-1 text-3xl font-bold">
          {weekTotalHours}<span className="text-lg font-semibold text-white/80">h</span>
        </p>
        <div className="mt-2 flex items-center gap-4">
          <p className="text-xs text-white/70">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
          </p>
          <p className="text-xs text-white/70">
            {weekTotalMinutes.toLocaleString()}m total
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {(['this_week', 'last_week', 'this_month'] as const).map((preset) => (
          <button
            key={preset}
            onClick={() => handleDatePresetChange(preset)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
              datePreset === preset
                ? 'bg-mpl-primary-light text-mpl-primary'
                : 'border border-mpl-border bg-mpl-surface text-slate-500'
            }`}
          >
            {getDateRangeLabel(preset)}
          </button>
        ))}
      </div>

      {/* Team Filter Buttons */}
      <div className="flex gap-2">
        {(['All', 'CH', 'MH'] as const).map((option) => (
          <button
            key={option}
            onClick={() => setFilter(option)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-150 ${
              filter === option
                ? 'bg-mpl-primary text-white'
                : 'border border-mpl-border bg-mpl-surface text-slate-500'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Member Cards */}
      {filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-mpl-border bg-mpl-surface p-6 text-center">
          <p className="text-sm text-slate-400">No team members found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member) => (
            <div
              key={member.userId}
              className="flex items-center gap-3 rounded-2xl border border-mpl-border bg-mpl-surface p-4"
            >
              {/* Initials Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mpl-primary-light text-sm font-bold text-mpl-primary">
                {getInitials(member.name)}
              </div>

              {/* Member Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {member.name}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      member.team === 'CH'
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#E0F2FE] text-[#0284C7]'
                    }`}
                  >
                    {member.team}
                  </span>
                </div>
                {member.topCategory ? (
                  <p className="mt-0.5 text-xs text-slate-400">
                    {member.topCategory.icon} {member.topCategory.label}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-slate-400">No entries this period</p>
                )}
                <p className="mt-0.5 text-xs text-slate-400">
                  {member.entryCount} {member.entryCount === 1 ? 'entry' : 'entries'}
                </p>
              </div>

              {/* Minutes */}
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-mpl-primary">
                  {member.totalMinutes.toLocaleString()}
                  <span className="text-sm">m</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

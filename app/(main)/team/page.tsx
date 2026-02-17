'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/database'

type TeamFilter = 'All' | 'CH' | 'MH'

type MemberStats = {
  userId: string
  name: string
  team: 'CH' | 'MH'
  entryCount: number
  totalMinutes: number
  topCategory: { label: string; icon: string } | null
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getWeekRange(): { start: string; end: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  // Start of week (Monday)
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  // End of week (Sunday 23:59:59)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday.toISOString(), end: sunday.toISOString() }
}

export default function TeamPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [memberStats, setMemberStats] = useState<MemberStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<TeamFilter>('All')

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Fetch current user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError || !profile) {
        setError('Failed to load profile')
        setLoading(false)
        return
      }

      setCurrentUser(profile)

      // If not supervisor, just show member view
      if (profile.role !== 'supervisor') {
        setLoading(false)
        return
      }

      // Fetch team members (RLS ensures only same-team users are returned for supervisors)
      const { data: teamMembers, error: membersError } = await supabase
        .from('users')
        .select('*')
        .eq('team', profile.team)

      if (membersError) {
        setError('Failed to load team members')
        setLoading(false)
        return
      }

      if (!teamMembers || teamMembers.length === 0) {
        setLoading(false)
        return
      }

      // Fetch this week's log entries for all team members
      const { start, end } = getWeekRange()
      const memberIds = teamMembers.map((m) => m.id)

      const { data: entries, error: entriesError } = await supabase
        .from('log_entries')
        .select('*, categories(label, icon)')
        .in('user_id', memberIds)
        .gte('created_at', start)
        .lte('created_at', end)

      if (entriesError) {
        setError('Failed to load team data')
        setLoading(false)
        return
      }

      // Aggregate stats per member
      const statsMap = new Map<string, {
        entryCount: number
        totalMinutes: number
        categoryMinutes: Map<string, { label: string; icon: string; minutes: number }>
      }>()

      // Initialize all members with zero stats
      for (const member of teamMembers) {
        statsMap.set(member.id, {
          entryCount: 0,
          totalMinutes: 0,
          categoryMinutes: new Map(),
        })
      }

      type EntryWithCategory = {
        user_id: string
        minutes: number
        category_id: string
        categories: { label: string; icon: string } | null
      }

      for (const entry of (entries as EntryWithCategory[]) ?? []) {
        const stats = statsMap.get(entry.user_id)
        if (!stats) continue

        stats.entryCount += 1
        stats.totalMinutes += entry.minutes

        const existing = stats.categoryMinutes.get(entry.category_id)
        if (existing) {
          existing.minutes += entry.minutes
        } else {
          stats.categoryMinutes.set(entry.category_id, {
            label: entry.categories?.label ?? 'Unknown',
            icon: entry.categories?.icon ?? '📌',
            minutes: entry.minutes,
          })
        }
      }

      // Build final member stats
      const result: MemberStats[] = teamMembers.map((member) => {
        const stats = statsMap.get(member.id)!
        let topCategory: MemberStats['topCategory'] = null

        if (stats.categoryMinutes.size > 0) {
          let maxMinutes = 0
          for (const cat of stats.categoryMinutes.values()) {
            if (cat.minutes > maxMinutes) {
              maxMinutes = cat.minutes
              topCategory = { label: cat.label, icon: cat.icon }
            }
          }
        }

        return {
          userId: member.id,
          name: member.name,
          team: member.team,
          entryCount: stats.entryCount,
          totalMinutes: stats.totalMinutes,
          topCategory,
        }
      })

      // Sort by total minutes descending
      result.sort((a, b) => b.totalMinutes - a.totalMinutes)

      setMemberStats(result)
      setLoading(false)
    }

    fetchData()
  }, [])

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
        <p className="text-xs font-medium text-white/70">This Week</p>
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

      {/* Filter Buttons */}
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
                  <p className="mt-0.5 text-xs text-slate-400">No entries this week</p>
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

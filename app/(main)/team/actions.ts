'use server'

import { createClient } from '@/lib/supabase/server'

export type MemberStats = {
  userId: string
  name: string
  team: 'CH' | 'MH'
  entryCount: number
  totalMinutes: number
  topCategory: { label: string; icon: string } | null
}

export type TeamDataResult = {
  members: MemberStats[]
  error: string | null
}

function getWeekRange(): { start: string; end: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday.toISOString(), end: sunday.toISOString() }
}

export async function fetchTeamData(
  dateRange?: { start: string; end: string }
): Promise<TeamDataResult> {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return { members: [], error: 'Not authenticated' }
  }

  // Fetch current user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) {
    return { members: [], error: 'Failed to load profile' }
  }

  if (profile.role !== 'supervisor') {
    return { members: [], error: 'Supervisor access required' }
  }

  // Fetch team members (RLS ensures only same-team users are returned)
  const { data: teamMembers, error: membersError } = await supabase
    .from('users')
    .select('*')
    .eq('team', profile.team)

  if (membersError) {
    return { members: [], error: 'Failed to load team members' }
  }

  if (!teamMembers || teamMembers.length === 0) {
    return { members: [], error: null }
  }

  // Use provided date range or default to current week
  const { start, end } = dateRange ?? getWeekRange()
  const memberIds = teamMembers.map((m) => m.id)

  const { data: entries, error: entriesError } = await supabase
    .from('log_entries')
    .select('*, categories(label, icon)')
    .in('user_id', memberIds)
    .gte('created_at', start)
    .lte('created_at', end)

  if (entriesError) {
    return { members: [], error: 'Failed to load team data' }
  }

  // Aggregate stats per member
  const statsMap = new Map<string, {
    entryCount: number
    totalMinutes: number
    categoryMinutes: Map<string, { label: string; icon: string; minutes: number }>
  }>()

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

  // Build final member stats sorted by total minutes descending
  const members: MemberStats[] = teamMembers
    .map((member) => {
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
    .sort((a, b) => b.totalMinutes - a.totalMinutes)

  return { members, error: null }
}

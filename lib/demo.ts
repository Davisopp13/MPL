import { createClient } from '@/lib/supabase/client'

const DEMO_EMAIL = 'demo@mpl.app'
const DEMO_PASSWORD = 'demo-mpl-2024'

async function seedDemoEntries(userId: string): Promise<void> {
  const supabase = createClient()

  // Fetch real CH categories with their subtasks
  const { data: categories } = await supabase
    .from('categories')
    .select('id, subtasks(id)')
    .eq('team', 'CH')
    .order('sort_order')

  if (!categories || categories.length === 0) return

  // Build a flat list of valid category/subtask pairs
  const pairs: Array<{ category_id: string; subtask_id: string }> = []
  for (const cat of categories) {
    const subtasks = cat.subtasks ?? []
    for (const st of subtasks) {
      pairs.push({ category_id: cat.id, subtask_id: st.id })
    }
  }

  if (pairs.length === 0) return

  const now = new Date()
  const entries = [
    // Today
    { daysAgo: 0, minutes: 15, occurrences: 2, verified: true },
    { daysAgo: 0, minutes: 5, occurrences: 1, verified: false },
    // Yesterday
    { daysAgo: 1, minutes: 30, occurrences: 3, verified: true },
    { daysAgo: 1, minutes: 10, occurrences: 1, verified: true },
    { daysAgo: 1, minutes: 20, occurrences: 2, verified: false },
    // Older
    { daysAgo: 3, minutes: 45, occurrences: 4, verified: true },
    { daysAgo: 4, minutes: 10, occurrences: 1, verified: false },
    { daysAgo: 5, minutes: 25, occurrences: 2, verified: true },
    { daysAgo: 6, minutes: 15, occurrences: 1, verified: true },
    { daysAgo: 7, minutes: 60, occurrences: 5, verified: true },
  ]

  const rows = entries.map((entry, i) => {
    const pair = pairs[i % pairs.length]
    const createdAt = new Date(now)
    createdAt.setDate(createdAt.getDate() - entry.daysAgo)
    // Vary the time of day
    createdAt.setHours(8 + (i % 8), i * 7 % 60)

    return {
      user_id: userId,
      category_id: pair.category_id,
      subtask_id: pair.subtask_id,
      minutes: entry.minutes,
      occurrences: entry.occurrences,
      verified: entry.verified,
      created_at: createdAt.toISOString(),
    }
  })

  await supabase.from('log_entries').insert(rows)
}

export async function loginAsDemo(): Promise<void> {
  const supabase = createClient()

  // Fast path: try signing in with existing demo account
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })

  if (signInError) {
    // First time: create the demo account
    const { error: signUpError } = await supabase.auth.signUp({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    })

    if (signUpError) {
      throw new Error(`Demo sign-up failed: ${signUpError.message}`)
    }

    // Now sign in with the newly created account
    const { error: retryError } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    })

    if (retryError) {
      throw new Error(
        `Demo sign-in failed: ${retryError.message}. ` +
        'Ensure email confirmation is disabled in Supabase Auth settings.'
      )
    }
  }

  // Ensure the users table profile exists
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Demo auth succeeded but no user session found.')

  const { data: existingProfile, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  const isNew = !existingProfile && selectError?.code === 'PGRST116'

  const { error: profileError } = await supabase.from('users').upsert({
    id: user.id,
    email: DEMO_EMAIL,
    name: 'Demo User',
    team: 'CH' as const,
    role: 'member' as const,
  }, { onConflict: 'id', ignoreDuplicates: true })

  if (profileError) {
    throw new Error(`Demo profile creation failed: ${profileError.message}`)
  }

  // Seed sample log entries only on first login
  if (isNew) {
    await seedDemoEntries(user.id)
  }
}

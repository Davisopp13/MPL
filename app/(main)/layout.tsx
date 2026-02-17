import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MplHeader from '@/components/MplHeader'
import BottomNav from '@/components/BottomNav'
import InstallPrompt from '@/components/InstallPrompt'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('name, team')
    .eq('id', authUser.id)
    .single()

  if (!profile) {
    redirect('/onboard')
  }

  const initials = getInitials(profile.name)

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-mpl-bg">
      <MplHeader initials={initials} team={profile.team} />
      <InstallPrompt />
      <main className="p-4 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

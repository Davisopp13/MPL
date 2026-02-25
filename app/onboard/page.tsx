'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [team, setTeam] = useState<'CH' | 'MH' | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkExistingUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (existingUser) {
        router.replace('/')
        return
      }

      setChecking(false)
    }

    checkExistingUser()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim() || !team) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Not authenticated. Please log in again.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      email: user.email!,
      name: name.trim(),
      team,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.replace('/')
  }

  if (checking) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[430px] items-center justify-center bg-mpl-bg">
        <div className="text-sm text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col items-center justify-center bg-mpl-bg px-4">
      <div className="mb-8 text-center">
        <img src="/icon-192x192.png" alt="MPL" className="mx-auto mb-4 h-16 w-16 rounded-2xl" />
        <h1 className="text-2xl font-bold text-slate-900">Welcome to MPL</h1>
        <p className="mt-1 text-sm text-slate-500">
          Set up your profile to get started
        </p>
      </div>

      <div className="w-full rounded-2xl border border-mpl-border bg-mpl-surface p-6">
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Your name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
            className="w-full rounded-lg border border-mpl-border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-mpl-primary focus:ring-1 focus:ring-mpl-primary"
          />

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-medium text-slate-700">
              Select your team
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTeam('CH')}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-colors duration-150 ${
                  team === 'CH'
                    ? 'border-mpl-accent bg-amber-50 text-amber-900'
                    : 'border-mpl-border bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-3xl">📦</span>
                <span className="text-sm font-semibold">CH</span>
                <span className="text-xs text-slate-500">
                  Carrier Haulage
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTeam('MH')}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-colors duration-150 ${
                  team === 'MH'
                    ? 'border-mpl-primary bg-mpl-primary-light text-blue-900'
                    : 'border-mpl-border bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-3xl">🚢</span>
                <span className="text-sm font-semibold">MH</span>
                <span className="text-xs text-slate-500">Merchant Haulage</span>
              </button>
            </div>
          </fieldset>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !team}
            className="mt-6 w-full rounded-lg bg-mpl-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-mpl-primary-dark disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  )
}

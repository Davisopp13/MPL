'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col items-center justify-center bg-mpl-bg px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-mpl-primary-dark to-mpl-primary text-2xl font-bold text-white">
          M
        </div>
        <h1 className="text-2xl font-bold text-slate-900">MPL</h1>
        <p className="mt-1 text-sm text-slate-500">Manual Process Log</p>
      </div>

      <div className="w-full rounded-2xl border border-mpl-border bg-mpl-surface p-6">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-2xl">
              ✉️
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              We sent a magic link to{' '}
              <span className="font-medium text-slate-700">{email}</span>.
              Click the link to sign in.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false)
                setEmail('')
              }}
              className="mt-4 text-sm font-medium text-mpl-primary"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full rounded-lg border border-mpl-border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-mpl-primary focus:ring-1 focus:ring-mpl-primary"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !email}
              className="mt-4 w-full rounded-lg bg-mpl-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-mpl-primary-dark disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

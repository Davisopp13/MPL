'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, Subtask } from '@/types/database'

type CategoryWithSubtasks = Category & { subtasks: Subtask[] }

type LogStep = 'category' | 'subtask' | 'time'

export default function LogPage() {
  const [categories, setCategories] = useState<CategoryWithSubtasks[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<LogStep>('category')
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithSubtasks | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('team')
        .eq('id', user.id)
        .single()

      if (!profile) return

      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*, subtasks(*)')
        .eq('team', profile.team)
        .order('sort_order')

      if (fetchError) {
        setError('Failed to load categories')
        setLoading(false)
        return
      }

      setCategories((data as CategoryWithSubtasks[]) ?? [])
      setLoading(false)
    }

    fetchCategories()
  }, [])

  function handleCategorySelect(category: CategoryWithSubtasks) {
    setSelectedCategory(category)
    setStep('subtask')
  }

  function handleBack() {
    if (step === 'subtask') {
      setStep('category')
      setSelectedCategory(null)
    } else if (step === 'time') {
      setStep('subtask')
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-mpl-border bg-mpl-surface"
            />
          ))}
        </div>
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

  return (
    <div>
      {/* Breadcrumb */}
      {step !== 'category' && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-mpl-border bg-mpl-surface text-slate-500 transition-colors duration-150 active:scale-[0.97]"
            aria-label="Go back"
          >
            ←
          </button>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <span
              className={step === 'subtask' ? 'font-medium text-slate-800' : 'cursor-pointer text-mpl-primary'}
              onClick={step !== 'subtask' ? () => { setStep('category'); setSelectedCategory(null) } : undefined}
            >
              {selectedCategory?.icon} {selectedCategory?.label}
            </span>
          </div>
        </div>
      )}

      {/* Step 1: Category Selection */}
      {step === 'category' && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Select Category
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className="flex flex-col items-start rounded-xl border border-mpl-border bg-mpl-surface p-4 text-left transition-colors duration-150 active:scale-[0.97] active:bg-mpl-primary-light"
              >
                <span className="text-2xl leading-none">{category.icon}</span>
                <span className="mt-2 text-sm font-semibold text-slate-800 leading-tight">
                  {category.label}
                </span>
                <span className="mt-1 text-xs text-slate-400">
                  {category.subtasks.length} {category.subtasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Placeholder for Step 2: Subtask Selection (to be built in 2.3) */}
      {step === 'subtask' && selectedCategory && (
        <div className="rounded-2xl border border-mpl-border bg-mpl-surface p-6 text-center">
          <p className="text-sm text-slate-500">
            Sub-task selection coming soon for {selectedCategory.label}
          </p>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, Subtask } from '@/types/database'

type CategoryWithSubtasks = Category & { subtasks: Subtask[] }

type LogStep = 'category' | 'subtask' | 'time'
type EntryMode = 'quick' | 'timer'

const TIME_CHIPS = [5, 10, 15, 20, 30, 45, 60] as const

export default function LogPage() {
  const [categories, setCategories] = useState<CategoryWithSubtasks[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<LogStep>('category')
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithSubtasks | null>(null)
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null)

  // Time entry state
  const [entryMode, setEntryMode] = useState<EntryMode>('quick')
  const [selectedChip, setSelectedChip] = useState<number | null>(null)
  const [customMinutes, setCustomMinutes] = useState('')
  const [occurrences, setOccurrences] = useState(1)
  const [note, setNote] = useState('')

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

  function handleSubtaskSelect(subtask: Subtask) {
    setSelectedSubtask(subtask)
    setStep('time')
  }

  function handleBack() {
    if (step === 'subtask') {
      setStep('category')
      setSelectedCategory(null)
      setSelectedSubtask(null)
    } else if (step === 'time') {
      setStep('subtask')
      setSelectedSubtask(null)
      resetTimeEntry()
    }
  }

  function resetTimeEntry() {
    setEntryMode('quick')
    setSelectedChip(null)
    setCustomMinutes('')
    setOccurrences(1)
    setNote('')
  }

  function handleChipSelect(minutes: number) {
    if (selectedChip === minutes) {
      setSelectedChip(null)
      setCustomMinutes('')
    } else {
      setSelectedChip(minutes)
      setCustomMinutes(String(minutes))
    }
  }

  function handleCustomMinutesChange(value: string) {
    // Only allow digits
    const cleaned = value.replace(/\D/g, '')
    setCustomMinutes(cleaned)
    const num = parseInt(cleaned, 10)
    if (TIME_CHIPS.includes(num as typeof TIME_CHIPS[number])) {
      setSelectedChip(num)
    } else {
      setSelectedChip(null)
    }
  }

  function handleOccurrenceChange(delta: number) {
    setOccurrences(prev => Math.max(1, prev + delta))
  }

  // Compute the effective minutes for the submit button label
  const effectiveMinutes = entryMode === 'quick'
    ? (selectedChip ?? (customMinutes ? parseInt(customMinutes, 10) : 0))
    : 0 // Timer mode will be handled in task 2.5
  const canSubmit = effectiveMinutes > 0

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
            <button
              type="button"
              className={step === 'subtask' ? 'font-medium text-slate-800' : 'cursor-pointer text-mpl-primary hover:underline'}
              onClick={step !== 'subtask' ? () => { setStep('subtask'); setSelectedSubtask(null) } : undefined}
            >
              {selectedCategory?.icon} {selectedCategory?.label}
            </button>
            {step === 'time' && selectedSubtask && (
              <>
                <span className="text-slate-300">›</span>
                <span className="font-medium text-slate-800">
                  {selectedSubtask.label}
                </span>
              </>
            )}
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

      {/* Step 2: Subtask Selection */}
      {step === 'subtask' && selectedCategory && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Select Sub-task
          </h2>
          <div className="overflow-hidden rounded-xl border border-mpl-border bg-mpl-surface">
            {selectedCategory.subtasks
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((subtask, index) => (
                <button
                  key={subtask.id}
                  onClick={() => handleSubtaskSelect(subtask)}
                  className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors duration-150 active:bg-mpl-primary-light ${
                    index < selectedCategory.subtasks.length - 1
                      ? 'border-b border-mpl-border'
                      : ''
                  }`}
                >
                  <span className="text-sm font-medium text-slate-800">
                    {subtask.label}
                  </span>
                  <span className="text-slate-300">›</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Step 3: Time Entry */}
      {step === 'time' && selectedCategory && selectedSubtask && (
        <div className="space-y-4">
          {/* Context pill */}
          <div className="flex items-center gap-2 rounded-xl border border-mpl-border bg-mpl-primary-light px-4 py-2.5">
            <span className="text-lg">{selectedCategory.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-mpl-primary-dark">{selectedCategory.label}</p>
              <p className="truncate text-sm font-semibold text-slate-800">{selectedSubtask.label}</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl border border-mpl-border bg-mpl-surface p-1">
            <button
              type="button"
              onClick={() => setEntryMode('quick')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors duration-150 ${
                entryMode === 'quick'
                  ? 'bg-mpl-primary text-white'
                  : 'text-slate-500'
              }`}
            >
              Quick Entry
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('timer')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors duration-150 ${
                entryMode === 'timer'
                  ? 'bg-mpl-primary text-white'
                  : 'text-slate-500'
              }`}
            >
              Timer
            </button>
          </div>

          {/* Quick Entry mode */}
          {entryMode === 'quick' && (
            <div className="space-y-4">
              {/* Time chips */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Time Spent
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIME_CHIPS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => handleChipSelect(minutes)}
                      className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors duration-150 active:scale-[0.97] ${
                        selectedChip === minutes
                          ? 'border-mpl-primary bg-mpl-primary text-white'
                          : 'border-mpl-border bg-mpl-surface text-slate-700'
                      }`}
                    >
                      {minutes}m
                    </button>
                  ))}
                  {/* Custom input */}
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Custom"
                      value={customMinutes && !TIME_CHIPS.includes(parseInt(customMinutes, 10) as typeof TIME_CHIPS[number]) ? customMinutes : ''}
                      onChange={(e) => handleCustomMinutesChange(e.target.value)}
                      className="w-20 rounded-full border border-mpl-border bg-mpl-surface px-3 py-2 text-center text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:border-mpl-primary focus:outline-none"
                    />
                    {customMinutes && !TIME_CHIPS.includes(parseInt(customMinutes, 10) as typeof TIME_CHIPS[number]) && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        m
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timer mode placeholder (to be built in task 2.5) */}
          {entryMode === 'timer' && (
            <div className="rounded-2xl border border-mpl-border bg-mpl-surface p-8 text-center">
              <p className="text-4xl font-mono font-bold text-slate-800">00:00</p>
              <p className="mt-2 text-sm text-slate-400">Timer coming soon</p>
            </div>
          )}

          {/* Occurrences stepper */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Occurrences
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOccurrenceChange(-1)}
                disabled={occurrences <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-mpl-border bg-mpl-surface text-lg font-bold text-slate-600 transition-colors duration-150 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
              >
                −
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={occurrences}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/\D/g, ''), 10)
                  if (val > 0) setOccurrences(val)
                  else if (e.target.value === '') setOccurrences(1)
                }}
                className="h-10 w-14 rounded-xl border border-mpl-border bg-mpl-surface text-center text-lg font-bold text-slate-800 focus:border-mpl-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleOccurrenceChange(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-mpl-border bg-mpl-surface text-lg font-bold text-slate-600 transition-colors duration-150 active:scale-[0.97]"
              >
                +
              </button>
              <span className="text-sm text-slate-400">How many times?</span>
            </div>
          </div>

          {/* Note textarea */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Note <span className="font-normal normal-case text-slate-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a quick note..."
              rows={2}
              className="w-full resize-none rounded-xl border border-mpl-border bg-mpl-surface px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-mpl-primary focus:outline-none"
            />
          </div>

          {/* Submit button */}
          <button
            type="button"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-mpl-primary py-3.5 text-base font-bold text-white transition-colors duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
          >
            {canSubmit ? `Log ${effectiveMinutes}m Entry` : 'Log Entry'}
          </button>
        </div>
      )}
    </div>
  )
}
